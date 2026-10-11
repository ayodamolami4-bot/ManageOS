const {
  createTaskStatusHistory,
  getTaskStatusHistory
} = require("../repositories/taskStatusHistoryRepository");

const {
  canManageTask,
  canViewTask
} = require("./authorizationService");

const {
  TASK_WORKFLOW
} = require("./taskWorkflowService");

const pool = require("../db/database");

async function getTaskForCompany(
  taskId,
  companyId
) {
  const result = await pool.query(
    `
    SELECT
      id,
      status
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
 * Kept for internal use only.
 *
 * This function now validates that:
 * 1. The task exists in the current user's company.
 * 2. The caller can manage the task.
 * 3. previousStatus matches the task's actual current status.
 * 4. newStatus is a valid workflow transition.
 *
 * The public HTTP POST route has been removed.
 */
async function recordStatusChange(
  {
    taskId,
    previousStatus,
    newStatus
  },
  currentUser
) {
  const task =
    await getTaskForCompany(
      taskId,
      currentUser.company_id
    );

  if (!task) {
    throw new Error(
      "TASK_NOT_FOUND"
    );
  }

  const allowed =
    await canManageTask(
      currentUser,
      taskId
    );

  if (!allowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  if (
    previousStatus !==
    task.status
  ) {
    throw new Error(
      "PREVIOUS_STATUS_MISMATCH"
    );
  }

  const allowedTransitions =
    TASK_WORKFLOW[
      task.status
    ];

  if (
    !allowedTransitions ||
    !allowedTransitions.includes(
      newStatus
    )
  ) {
    throw new Error(
      "INVALID_STATUS_TRANSITION"
    );
  }

  return await createTaskStatusHistory({
    taskId,
    previousStatus,
    newStatus,
    changedBy:
      currentUser.id
  });
}

async function getStatusHistory(
  taskId,
  currentUser
) {
  const task =
    await getTaskForCompany(
      taskId,
      currentUser.company_id
    );

  if (!task) {
    throw new Error(
      "TASK_NOT_FOUND"
    );
  }

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

  return await getTaskStatusHistory(
    taskId
  );
}

module.exports = {
  recordStatusChange,
  getStatusHistory
};