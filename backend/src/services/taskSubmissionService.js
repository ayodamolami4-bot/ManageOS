const {
  createSubmissionAndChangeStatus,
  getTaskSubmissions,
  getTaskSubmissionById
} = require("../repositories/taskSubmissionRepository");

const {
  canSubmitTask,
  canViewTask
} = require("./authorizationService");

const pool = require("../db/database");

async function getTaskForCompany(
  taskId,
  companyId
) {
  const result = await pool.query(
    `
    SELECT
      id,
      project_id,
      status,
      company_id
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

async function createSubmission(
  {
    taskId,
    description
  },
  user
) {
  const task =
    await getTaskForCompany(
      taskId,
      user.company_id
    );

  if (!task) {
    throw new Error(
      "TASK_NOT_FOUND"
    );
  }

  const allowed =
    await canSubmitTask(
      user,
      taskId
    );

  if (!allowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  if (
    task.status !==
    "IN_PROGRESS"
  ) {
    throw new Error(
      "TASK_NOT_READY_FOR_SUBMISSION"
    );
  }

  return await createSubmissionAndChangeStatus({
    taskId,
    companyId:
      user.company_id,
    submittedBy:
      user.id,
    description
  });
}

async function getSubmissions(
  taskId,
  user
) {
  const task =
    await getTaskForCompany(
      taskId,
      user.company_id
    );

  if (!task) {
    throw new Error(
      "TASK_NOT_FOUND"
    );
  }

  const allowed =
    await canViewTask(
      user,
      taskId
    );

  if (!allowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  return await getTaskSubmissions(
    taskId
  );
}

async function getSubmission(
  submissionId,
  user
) {
  const submission =
    await getTaskSubmissionById(
      submissionId
    );

  if (!submission) {
    throw new Error(
      "SUBMISSION_NOT_FOUND"
    );
  }

  const task =
    await getTaskForCompany(
      submission.task_id,
      user.company_id
    );

  if (!task) {
    throw new Error(
      "SUBMISSION_NOT_FOUND"
    );
  }

  const allowed =
    await canViewTask(
      user,
      submission.task_id
    );

  if (!allowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  return submission;
}

module.exports = {
  createSubmission,
  getSubmissions,
  getSubmission
};