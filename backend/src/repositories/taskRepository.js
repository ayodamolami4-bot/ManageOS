const pool =
  require("../db/database");

const {
  createActivityWithClient
} = require("./activityRepository");

const {
  createAuditLogWithClient
} = require("./auditLogRepository");

async function createTask({
  companyId,
  projectId,
  milestoneId,
  title,
  description,
  status,
  priority,
  dueDate,
  createdBy
}) {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    const taskResult =
      await client.query(
        `
        INSERT INTO tasks (
          company_id,
          project_id,
          milestone_id,
          title,
          description,
          status,
          priority,
          due_date,
          created_by
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9
        )
        RETURNING *
        `,
        [
          companyId,
          projectId,
          milestoneId,
          title,
          description,
          status,
          priority,
          dueDate,
          createdBy
        ]
      );

    const task =
      taskResult.rows[0];

    await createActivityWithClient(
      client,
      {
        companyId,
        actorId: createdBy,
        action:
          "TASK_CREATED",
        resourceType:
          "TASK",
        resourceId:
          task.id,
        metadata: {
          title:
            task.title,
          project_id:
            task.project_id,
          milestone_id:
            task.milestone_id,
          status:
            task.status,
          priority:
            task.priority
        }
      }
    );

    await client.query(
      "COMMIT"
    );

    return task;
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

async function getTasks(
  companyId
) {
  const result =
    await pool.query(
      `
      SELECT
        id,
        company_id,
        project_id,
        milestone_id,
        title,
        description,
        status,
        priority,
        due_date,
        created_by,
        created_at,
        updated_at
      FROM tasks
      WHERE company_id = $1
      ORDER BY created_at DESC
      `,
      [companyId]
    );

  return result.rows;
}

async function getTaskById(
  companyId,
  taskId
) {
  const result =
    await pool.query(
      `
      SELECT
        id,
        company_id,
        project_id,
        milestone_id,
        title,
        description,
        status,
        priority,
        due_date,
        created_by,
        created_at,
        updated_at
      FROM tasks
      WHERE id = $1
        AND company_id = $2
      LIMIT 1
      `,
      [
        taskId,
        companyId
      ]
    );

  return result.rows[0];
}

/*
 * Update task details only.
 *
 * Status is intentionally excluded.
 * Workflow state changes must use
 * updateTaskStatusWithHistory().
 */
async function updateTask({
  companyId,
  taskId,
  milestoneId,
  title,
  description,
  priority,
  dueDate
}) {
  const result =
    await pool.query(
      `
      UPDATE tasks
      SET
        milestone_id = $1,
        title = $2,
        description = $3,
        priority = $4,
        due_date = $5,
        updated_at = NOW()
      WHERE id = $6
        AND company_id = $7
      RETURNING *
      `,
      [
        milestoneId,
        title,
        description,
        priority,
        dueDate,
        taskId,
        companyId
      ]
    );

  return result.rows[0];
}

async function deleteTask(
  companyId,
  taskId
) {
  const result =
    await pool.query(
      `
      DELETE FROM tasks
      WHERE id = $1
        AND company_id = $2
      RETURNING id
      `,
      [
        taskId,
        companyId
      ]
    );

  return result.rows[0];
}

async function updateTaskStatusWithHistory({
  taskId,
  companyId,
  newStatus,
  changedBy
}) {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    const taskResult =
      await client.query(
        `
        SELECT
          id,
          status
        FROM tasks
        WHERE id = $1
          AND company_id = $2
        LIMIT 1
        FOR UPDATE
        `,
        [
          taskId,
          companyId
        ]
      );

    const task =
      taskResult.rows[0];

    if (!task) {
      throw new Error(
        "TASK_NOT_FOUND"
      );
    }

    const previousStatus =
      task.status;

    if (
      previousStatus ===
      newStatus
    ) {
      throw new Error(
        "STATUS_UNCHANGED"
      );
    }

    const updatedTaskResult =
      await client.query(
        `
        UPDATE tasks
        SET
          status = $1,
          updated_at = NOW()
        WHERE id = $2
          AND company_id = $3
        RETURNING *
        `,
        [
          newStatus,
          taskId,
          companyId
        ]
      );

    const historyResult =
      await client.query(
        `
        INSERT INTO task_status_history (
          task_id,
          previous_status,
          new_status,
          changed_by
        )
        VALUES (
          $1,
          $2,
          $3,
          $4
        )
        RETURNING *
        `,
        [
          taskId,
          previousStatus,
          newStatus,
          changedBy
        ]
      );

    await createActivityWithClient(
      client,
      {
        companyId,
        actorId: changedBy,
        action:
          "TASK_STATUS_CHANGED",
        resourceType:
          "TASK",
        resourceId:
          taskId,
        metadata: {
          previous_status:
            previousStatus,
          new_status:
            newStatus
        }
      }
    );

    await createAuditLogWithClient(
      client,
      {
        companyId,
        actorId: changedBy,
        action:
          "TASK_STATUS_CHANGED",
        resourceType:
          "TASK",
        resourceId:
          taskId,
        oldValues: {
          status:
            previousStatus
        },
        newValues: {
          status:
            newStatus
        },
        metadata: {
          source:
            "TASK_STATUS_UPDATE"
        }
      }
    );

    await client.query(
      "COMMIT"
    );

    return {
      task:
        updatedTaskResult.rows[0],
      history:
        historyResult.rows[0]
    };
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatusWithHistory
};