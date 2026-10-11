const {
  getTaskById,
  updateTaskStatusWithHistory
} = require("../repositories/taskRepository");

const {
  canChangeTaskStatus
} = require("./authorizationService");

const TASK_WORKFLOW = {
  ASSIGNED: [
    "IN_PROGRESS"
  ],

  IN_PROGRESS: [
    "SUBMITTED"
  ],

  SUBMITTED: [
    "TEAM_LEAD_REVIEW"
  ],

  TEAM_LEAD_REVIEW: [
    "APPROVED",
    "NEEDS_CHANGES"
  ],

  NEEDS_CHANGES: [
    "IN_PROGRESS"
  ],

  APPROVED: [
    "COMPLETED"
  ],

  COMPLETED: []
};

async function changeTaskStatus(
  {
    taskId,
    newStatus
  },
  user
) {
  if (!TASK_WORKFLOW[newStatus]) {
    throw new Error(
      "INVALID_STATUS"
    );
  }

  const task =
    await getTaskById(
      user.company_id,
      taskId
    );

  if (!task) {
    throw new Error(
      "TASK_NOT_FOUND"
    );
  }

  const allowed =
    await canChangeTaskStatus(
      user,
      taskId,
      newStatus
    );

  if (!allowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  const allowedTransitions =
    TASK_WORKFLOW[
      task.status
    ];

  if (
    !allowedTransitions.includes(
      newStatus
    )
  ) {
    throw new Error(
      "INVALID_STATUS_TRANSITION"
    );
  }

  return await updateTaskStatusWithHistory({
    taskId,
    companyId:
      user.company_id,
    newStatus,
    changedBy:
      user.id
  });
}

module.exports = {
  TASK_WORKFLOW,
  changeTaskStatus
};