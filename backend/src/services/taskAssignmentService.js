const {
  createTaskAssignment,
  getActiveTaskAssignment,
  getTaskAssignments,
  endTaskAssignment
} = require("../repositories/taskAssignmentRepository");

const {
  createNewNotification
} = require("./notificationService");

const {
  createNewActivity
} = require("./activityService");

const {
  canManageTask,
  canViewTask,
  isProjectMember
} = require("./authorizationService");

const pool = require("../db/database");

async function getTaskWithProject(
  taskId,
  companyId
) {
  const result = await pool.query(
    `
    SELECT
      t.id,
      t.project_id,
      t.company_id
    FROM tasks t
    WHERE t.id = $1
      AND t.company_id = $2
    LIMIT 1
    `,
    [
      taskId,
      companyId
    ]
  );

  return result.rows[0];
}

async function verifyTaskBelongsToCompany(
  taskId,
  companyId
) {
  const task =
    await getTaskWithProject(
      taskId,
      companyId
    );

  if (!task) {
    throw new Error(
      "TASK_NOT_FOUND"
    );
  }

  return task;
}

async function verifyUserBelongsToCompany(
  userId,
  companyId
) {
  const result = await pool.query(
    `
    SELECT id
    FROM users
    WHERE id = $1
      AND company_id = $2
    LIMIT 1
    `,
    [
      userId,
      companyId
    ]
  );

  if (!result.rows[0]) {
    throw new Error(
      "USER_NOT_FOUND"
    );
  }
}

async function recordAuditLog({
  companyId,
  actorId,
  action,
  resourceId,
  oldValues = null,
  newValues = null,
  metadata = {}
}) {
  await pool.query(
    `
    INSERT INTO audit_logs (
      company_id,
      actor_id,
      action,
      resource_type,
      resource_id,
      old_values,
      new_values,
      metadata
    )
    VALUES (
      $1, $2, $3, 'TASK',
      $4, $5, $6, $7
    )
    `,
    [
      companyId,
      actorId,
      action,
      resourceId,
      oldValues,
      newValues,
      metadata
    ]
  );
}

async function assignTask(
  {
    taskId,
    userId,
    estimatedEffortHours
  },
  currentUser
) {
  const task =
    await verifyTaskBelongsToCompany(
      taskId,
      currentUser.company_id
    );

  const canManage =
    await canManageTask(
      currentUser,
      taskId
    );

  if (!canManage) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  await verifyUserBelongsToCompany(
    userId,
    currentUser.company_id
  );

  const targetIsProjectMember =
    await isProjectMember(
      userId,
      currentUser.company_id,
      task.project_id
    );

  if (!targetIsProjectMember) {
    throw new Error(
      "USER_NOT_PROJECT_MEMBER"
    );
  }

  const activeAssignment =
    await getActiveTaskAssignment(
      taskId
    );

  if (activeAssignment) {
    throw new Error(
      "TASK_ALREADY_ASSIGNED"
    );
  }

  const assignment =
    await createTaskAssignment({
      taskId,
      userId,
      assignedBy:
        currentUser.id,
      estimatedEffortHours
    });

  await createNewNotification(
    {
      recipientId: userId,
      type: "TASK_ASSIGNED",
      title:
        "New task assigned",
      message:
        "You have been assigned a new task.",
      resourceType: "TASK",
      resourceId: taskId
    },
    currentUser
  );

  await createNewActivity(
    {
      action:
        "TASK_ASSIGNED",
      resourceType: "TASK",
      resourceId: taskId,
      metadata: {
        assigned_to:
          userId,
        assigned_by:
          currentUser.id,
        estimated_effort_hours:
          estimatedEffortHours ??
          null
      }
    },
    currentUser
  );

  await recordAuditLog({
    companyId:
      currentUser.company_id,
    actorId:
      currentUser.id,
    action:
      "TASK_ASSIGNED",
    resourceId:
      taskId,
    oldValues: null,
    newValues: {
      assignment_id:
        assignment.id,
      assigned_to:
        userId,
      assigned_by:
        currentUser.id,
      estimated_effort_hours:
        estimatedEffortHours ??
        null
    },
    metadata: {
      project_id:
        task.project_id
    }
  });

  return assignment;
}

async function getTaskAssignmentHistory(
  taskId,
  currentUser
) {
  await verifyTaskBelongsToCompany(
    taskId,
    currentUser.company_id
  );

  const allowed =
    await canViewTask(
      currentUser,
      taskId
    );

  if (!allowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  return await getTaskAssignments(
    taskId
  );
}

async function endAssignment(
  assignmentId,
  currentUser
) {
  const result =
    await pool.query(
      `
      SELECT
        ta.id,
        ta.task_id,
        ta.user_id,
        ta.assigned_by,
        ta.estimated_effort_hours,
        ta.assigned_at,
        t.project_id,
        t.company_id
      FROM task_assignments ta
      JOIN tasks t
        ON t.id = ta.task_id
      WHERE ta.id = $1
        AND t.company_id = $2
        AND ta.ended_at IS NULL
      LIMIT 1
      `,
      [
        assignmentId,
        currentUser.company_id
      ]
    );

  const assignment =
    result.rows[0];

  if (!assignment) {
    throw new Error(
      "ASSIGNMENT_NOT_FOUND"
    );
  }

  const allowed =
    await canManageTask(
      currentUser,
      assignment.task_id
    );

  if (!allowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  const endedAssignment =
    await endTaskAssignment(
      assignmentId,
      new Date()
    );

  await createNewActivity(
    {
      action:
        "TASK_ASSIGNMENT_ENDED",
      resourceType: "TASK",
      resourceId:
        assignment.task_id,
      metadata: {
        assignment_id:
          assignment.id,
        previously_assigned_to:
          assignment.user_id,
        ended_by:
          currentUser.id
      }
    },
    currentUser
  );

  await recordAuditLog({
    companyId:
      currentUser.company_id,
    actorId:
      currentUser.id,
    action:
      "TASK_ASSIGNMENT_ENDED",
    resourceId:
      assignment.task_id,
    oldValues: {
      assignment_id:
        assignment.id,
      assigned_to:
        assignment.user_id,
      assigned_by:
        assignment.assigned_by,
      estimated_effort_hours:
        assignment.estimated_effort_hours,
      assigned_at:
        assignment.assigned_at
    },
    newValues: {
      ended_at:
        endedAssignment?.ended_at ||
        new Date()
    },
    metadata: {
      project_id:
        assignment.project_id
    }
  });

  return endedAssignment;
}

module.exports = {
  assignTask,
  getTaskAssignmentHistory,
  endAssignment
};