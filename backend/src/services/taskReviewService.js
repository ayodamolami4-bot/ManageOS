const {
  createTaskReview,
  getTaskReviews,
  getTaskReviewById,
  createReviewAndApplyDecision
} = require("../repositories/taskReviewRepository");

const {
  canReviewTask,
  canViewTask
} = require("./authorizationService");

const pool = require("../db/database");

async function getSubmissionForCompany(
  submissionId,
  companyId
) {
  const result = await pool.query(
    `
    SELECT
      ts.id,
      ts.task_id,
      ts.submitted_by,
      ts.description,
      ts.submitted_at,
      t.company_id,
      t.status
    FROM task_submissions ts
    JOIN tasks t
      ON t.id = ts.task_id
    WHERE ts.id = $1
      AND t.company_id = $2
    LIMIT 1
    `,
    [
      submissionId,
      companyId
    ]
  );

  return result.rows[0];
}

async function createReview(
  {
    submissionId,
    decision,
    comment
  },
  user
) {
  if (
    decision !== "APPROVED" &&
    decision !== "NEEDS_CHANGES"
  ) {
    throw new Error(
      "INVALID_REVIEW_DECISION"
    );
  }

  const submission =
    await getSubmissionForCompany(
      submissionId,
      user.company_id
    );

  if (!submission) {
    throw new Error(
      "SUBMISSION_NOT_FOUND"
    );
  }

  if (
    submission.status !==
    "SUBMITTED"
  ) {
    throw new Error(
      "SUBMISSION_NOT_READY_FOR_REVIEW"
    );
  }

  const allowed =
    await canReviewTask(
      user,
      submission.task_id
    );

  if (!allowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  return await createReviewAndApplyDecision({
    submissionId,
    companyId:
      user.company_id,
    reviewedBy:
      user.id,
    decision,
    comment
  });
}

async function getReviews(
  submissionId,
  user
) {
  const submission =
    await getSubmissionForCompany(
      submissionId,
      user.company_id
    );

  if (!submission) {
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

  return await getTaskReviews(
    submissionId
  );
}

async function getReview(
  reviewId,
  user
) {
  const review =
    await getTaskReviewById(
      reviewId
    );

  if (!review) {
    throw new Error(
      "REVIEW_NOT_FOUND"
    );
  }

  const submission =
    await getSubmissionForCompany(
      review.submission_id,
      user.company_id
    );

  if (!submission) {
    throw new Error(
      "REVIEW_NOT_FOUND"
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

  return review;
}

module.exports = {
  createReview,
  getReviews,
  getReview
};