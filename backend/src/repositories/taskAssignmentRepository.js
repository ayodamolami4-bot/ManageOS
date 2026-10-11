const pool = require("../db/database");
const { createNotificationWithClient } = require("./notificationRepository");
const { createActivityWithClient } = require("./activityRepository");
const { createAuditLogWithClient } = require("./auditLogRepository");

async function createTaskAssignment({
  taskId,
  userId,
  assignedBy,
  estimatedEffortHours
}) {
  const result = await pool.query(
    `
    INSERT INTO task_assignments (
      task_id,
      user_id,
      assigned_by,
      estimated_effort_hours
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [
      taskId,
      userId,
      assignedBy,
      estimatedEffortHours
    ]
  );

  return result.rows[0];
}

async function getActiveTaskAssignment(taskId) {
  const result = await pool.query(
    `
    SELECT
      id,
      task_id,
      user_id,
      assigned_by,
      estimated_effort_hours,
      assigned_at,
      ended_at
    FROM task_assignments
    WHERE task_id = $1
      AND ended_at IS NULL
    LIMIT 1
    `,
    [taskId]
  );

  return result.rows[0];
}

async function getTaskAssignments(taskId) {
  const result = await pool.query(
    `
    SELECT
      id,
      task_id,
      user_id,
      assigned_by,
      estimated_effort_hours,
      assigned_at,
      ended_at
    FROM task_assignments
    WHERE task_id = $1
    ORDER BY assigned_at DESC
    `,
    [taskId]
  );

  return result.rows;
}

async function endTaskAssignment(
  assignmentId,
  endedAt
) {
  const result = await pool.query(
    `
    UPDATE task_assignments
    SET ended_at = $1
    WHERE id = $2
      AND ended_at IS NULL
    RETURNING *
    `,
    [endedAt, assignmentId]
  );

  return result.rows[0];
}


/**
 * Lock the task row so simultaneous assignment requests serialize. Every
 * related record is committed together or rolled back together.
 */
async function assignTaskAtomically({
  taskId, companyId, userId, assignedBy, estimatedEffortHours,
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const tasks = await client.query(
      `SELECT id, project_id, status FROM tasks
       WHERE id = $1 AND company_id = $2 FOR UPDATE`,
      [taskId, companyId]
    );
    const task = tasks.rows[0];
    if (!task) throw new Error("TASK_NOT_FOUND");
    if (!["ASSIGNED", "IN_PROGRESS"].includes(task.status)) {
      throw new Error("TASK_NOT_ASSIGNABLE");
    }

    const member = await client.query(
      `SELECT 1 FROM project_members pm
       JOIN projects p ON p.id = pm.project_id
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1 AND pm.user_id = $2
         AND p.company_id = $3 AND u.company_id = $3 LIMIT 1`,
      [task.project_id, userId, companyId]
    );
    if (!member.rows.length) throw new Error("USER_NOT_PROJECT_MEMBER");

    // An EMPLOYEE must already belong to an organization unit.
    // If this project is linked to units, one must match. Lock the
    // membership row against a concurrent unit-membership deletion.
    const employeeRole = await client.query(
      `SELECT 1 FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       JOIN users u ON u.id = ur.user_id
       WHERE ur.user_id = $1 AND u.company_id = $2
         AND r.name = 'EMPLOYEE' AND r.is_system = TRUE
         AND r.company_id IS NULL LIMIT 1`,
      [userId, companyId]
    );
    if (employeeRole.rows.length) {
      const unitMembership = await client.query(
        `SELECT om.id FROM organization_memberships om
         JOIN organization_units ou ON ou.id = om.organization_unit_id
         WHERE om.user_id = $1 AND ou.company_id = $2
           AND (
             NOT EXISTS (
               SELECT 1 FROM project_organization_units
               WHERE project_id = $3
             )
             OR om.organization_unit_id IN (
               SELECT organization_unit_id FROM project_organization_units
               WHERE project_id = $3
             )
           )
         LIMIT 1 FOR SHARE OF om`,
        [userId, companyId, task.project_id]
      );
      if (!unitMembership.rows.length) {
        throw new Error("EMPLOYEE_UNIT_MEMBERSHIP_REQUIRED");
      }
    }

    const assigned = await client.query(
      `SELECT id FROM task_assignments
       WHERE task_id = $1 AND ended_at IS NULL LIMIT 1`,
      [taskId]
    );
    if (assigned.rows.length) throw new Error("TASK_ALREADY_ASSIGNED");

    const inserted = await client.query(
      `INSERT INTO task_assignments
         (task_id, user_id, assigned_by, estimated_effort_hours)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [taskId, userId, assignedBy, estimatedEffortHours ?? null]
    );
    const assignment = inserted.rows[0];

    await createNotificationWithClient(client, {
      recipientId: userId,
      type: "TASK_ASSIGNED",
      title: "New task assigned",
      message: "You have been assigned a task.",
      resourceType: "TASK",
      resourceId: taskId,
    });
    await createActivityWithClient(client, {
      companyId, actorId: assignedBy,
      action: "TASK_ASSIGNED", resourceType: "TASK", resourceId: taskId,
      metadata: { assignment_id: assignment.id, user_id: userId },
    });
    await createAuditLogWithClient(client, {
      companyId, actorId: assignedBy,
      action: "TASK_ASSIGNED", resourceType: "TASK", resourceId: taskId,
      newValues: {
        assignment_id: assignment.id, assigned_to: userId,
        estimated_effort_hours: estimatedEffortHours ?? null,
      },
    });

    await client.query("COMMIT");
    return assignment;
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") throw new Error("TASK_ALREADY_ASSIGNED");
    throw error;
  } finally {
    client.release();
  }
}

async function endTaskAssignmentAtomically({ assignmentId, taskId, companyId, endedBy }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const task = await client.query(
      `SELECT id FROM tasks WHERE id = $1 AND company_id = $2 FOR UPDATE`,
      [taskId, companyId]
    );
    if (!task.rows.length) throw new Error("ASSIGNMENT_NOT_FOUND");

    const result = await client.query(
      `UPDATE task_assignments SET ended_at = NOW()
       WHERE id = $1 AND task_id = $2 AND ended_at IS NULL RETURNING *`,
      [assignmentId, taskId]
    );
    const assignment = result.rows[0];
    if (!assignment) throw new Error("ASSIGNMENT_NOT_FOUND");

    await createActivityWithClient(client, {
      companyId, actorId: endedBy,
      action: "TASK_ASSIGNMENT_ENDED", resourceType: "TASK", resourceId: taskId,
      metadata: { assignment_id: assignmentId, user_id: assignment.user_id },
    });
    await createAuditLogWithClient(client, {
      companyId, actorId: endedBy,
      action: "TASK_ASSIGNMENT_ENDED", resourceType: "TASK", resourceId: taskId,
      oldValues: { assignment_id: assignmentId, assigned_to: assignment.user_id },
      newValues: { ended_at: assignment.ended_at },
    });

    await client.query("COMMIT");
    return assignment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createTaskAssignment,
  getActiveTaskAssignment,
  getTaskAssignments,
  endTaskAssignment,
  assignTaskAtomically,
  endTaskAssignmentAtomically
};