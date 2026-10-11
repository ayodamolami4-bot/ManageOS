const pool = require("../db/database");

const {
  createNotificationWithClient
} = require("./notificationRepository");

const {
  createActivityWithClient
} = require("./activityRepository");
const { createAuditLogWithClient } = require("./auditLogRepository");

async function createTaskReview({
  submissionId,
  reviewedBy,
  decision,
  comment
}) {
  const result = await pool.query(
    `
    INSERT INTO task_reviews (
      submission_id,
      reviewed_by,
      decision,
      comment
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [
      submissionId,
      reviewedBy,
      decision,
      comment
    ]
  );

  return result.rows[0];
}

async function getTaskReviews(submissionId) {
  const result = await pool.query(
    `
    SELECT
      id,
      submission_id,
      reviewed_by,
      decision,
      comment,
      reviewed_at,
      created_at
    FROM task_reviews
    WHERE submission_id = $1
    ORDER BY reviewed_at DESC
    `,
    [submissionId]
  );

  return result.rows;
}

async function getTaskReviewById(reviewId) {
  const result = await pool.query(
    `
    SELECT
      id,
      submission_id,
      reviewed_by,
      decision,
      comment,
      reviewed_at,
      created_at
    FROM task_reviews
    WHERE id = $1
    LIMIT 1
    `,
    [reviewId]
  );

  return result.rows[0];
}

async function createReviewAndApplyDecision({
  submissionId,
  companyId,
  reviewedBy,
  decision,
  comment
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get the submission and its task
    const submissionResult = await client.query(
      `
      SELECT
        ts.id AS submission_id,
        ts.task_id,
        ts.submitted_by,
        t.company_id,
        t.status
      FROM task_submissions ts
      JOIN tasks t ON t.id = ts.task_id
      WHERE ts.id = $1
        AND t.company_id = $2
      FOR UPDATE OF t
      `,
      [
        submissionId,
        companyId
      ]
    );

    const submission = submissionResult.rows[0];

    if (!submission) {
      throw new Error("SUBMISSION_NOT_FOUND");
    }

    if (submission.status !== "SUBMITTED") {
      throw new Error("SUBMISSION_NOT_READY_FOR_REVIEW");
    }

    if (
      decision !== "APPROVED" &&
      decision !== "NEEDS_CHANGES"
    ) {
      throw new Error("INVALID_REVIEW_DECISION");
    }

    // Create the review
    const reviewResult = await client.query(
      `
      INSERT INTO task_reviews (
        submission_id,
        reviewed_by,
        decision,
        comment
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        submissionId,
        reviewedBy,
        decision,
        comment
      ]
    );

    const review = reviewResult.rows[0];

    const history = [];

    // SUBMITTED → TEAM_LEAD_REVIEW
    await client.query(
      `
      UPDATE tasks
      SET
        status = 'TEAM_LEAD_REVIEW',
        updated_at = NOW()
      WHERE id = $1
      `,
      [submission.task_id]
    );

    const reviewHistory = await client.query(
      `
      INSERT INTO task_status_history (
        task_id,
        previous_status,
        new_status,
        changed_by
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        submission.task_id,
        "SUBMITTED",
        "TEAM_LEAD_REVIEW",
        reviewedBy
      ]
    );

    history.push(reviewHistory.rows[0]);

    let finalStatus;

    if (decision === "APPROVED") {
      // TEAM_LEAD_REVIEW → APPROVED
      await client.query(
        `
        UPDATE tasks
        SET
          status = 'APPROVED',
          updated_at = NOW()
        WHERE id = $1
        `,
        [submission.task_id]
      );

      const approvedHistory = await client.query(
        `
        INSERT INTO task_status_history (
          task_id,
          previous_status,
          new_status,
          changed_by
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [
          submission.task_id,
          "TEAM_LEAD_REVIEW",
          "APPROVED",
          reviewedBy
        ]
      );

      history.push(approvedHistory.rows[0]);

      // APPROVED → COMPLETED
      await client.query(
        `
        UPDATE tasks
        SET
          status = 'COMPLETED',
          updated_at = NOW()
        WHERE id = $1
        `,
        [submission.task_id]
      );

      const completedHistory = await client.query(
        `
        INSERT INTO task_status_history (
          task_id,
          previous_status,
          new_status,
          changed_by
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [
          submission.task_id,
          "APPROVED",
          "COMPLETED",
          reviewedBy
        ]
      );

      history.push(completedHistory.rows[0]);

      finalStatus = "COMPLETED";

      // Notify employee
      await createNotificationWithClient(
        client,
        {
          recipientId: submission.submitted_by,
          type: "TASK_COMPLETED",
          title: "Task approved and completed",
          message:
            "Your task has been approved and marked as completed.",
          resourceType: "TASK",
          resourceId: submission.task_id
        }
      );

      // Record activity
      await createActivityWithClient(
        client,
        {
          companyId,
          actorId: reviewedBy,
          action: "TASK_COMPLETED",
          resourceType: "TASK",
          resourceId: submission.task_id,
          metadata: {
            reviewed_by: reviewedBy,
            comment: comment || null
          }
        }
      );

    } else {
      // TEAM_LEAD_REVIEW → NEEDS_CHANGES
      await client.query(
        `
        UPDATE tasks
        SET
          status = 'NEEDS_CHANGES',
          updated_at = NOW()
        WHERE id = $1
        `,
        [submission.task_id]
      );

      const changesHistory = await client.query(
        `
        INSERT INTO task_status_history (
          task_id,
          previous_status,
          new_status,
          changed_by
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [
          submission.task_id,
          "TEAM_LEAD_REVIEW",
          "NEEDS_CHANGES",
          reviewedBy
        ]
      );

      history.push(changesHistory.rows[0]);

      // NEEDS_CHANGES → IN_PROGRESS
      await client.query(
        `
        UPDATE tasks
        SET
          status = 'IN_PROGRESS',
          updated_at = NOW()
        WHERE id = $1
        `,
        [submission.task_id]
      );

      const inProgressHistory = await client.query(
        `
        INSERT INTO task_status_history (
          task_id,
          previous_status,
          new_status,
          changed_by
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [
          submission.task_id,
          "NEEDS_CHANGES",
          "IN_PROGRESS",
          reviewedBy
        ]
      );

      history.push(inProgressHistory.rows[0]);

      finalStatus = "IN_PROGRESS";

      // Notify employee
      await createNotificationWithClient(
        client,
        {
          recipientId: submission.submitted_by,
          type: "TASK_NEEDS_CHANGES",
          title: "Changes requested on your task",
          message:
            comment && comment.trim()
              ? `Your task needs changes. Reviewer's comment: ${comment.trim()}`
              : "Your task needs changes. Please review the feedback and make the required updates.",
          resourceType: "TASK",
          resourceId: submission.task_id
        }
      );

      // Record activity
      await createActivityWithClient(
        client,
        {
          companyId,
          actorId: reviewedBy,
          action: "TASK_NEEDS_CHANGES",
          resourceType: "TASK",
          resourceId: submission.task_id,
          metadata: {
            reviewed_by: reviewedBy,
            comment: comment || null
          }
        }
      );
    }

    await createAuditLogWithClient(client, {
      companyId,
      actorId: reviewedBy,
      action: "TASK_REVIEW_DECIDED",
      resourceType: "TASK",
      resourceId: submission.task_id,
      oldValues: { status: "SUBMITTED" },
      newValues: { status: finalStatus, decision, review_id: review.id },
      metadata: { submission_id: submissionId },
    });

    const taskResult = await client.query(
      `
      SELECT *
      FROM tasks
      WHERE id = $1
      `,
      [submission.task_id]
    );

    await client.query("COMMIT");

    return {
      review,
      task: taskResult.rows[0],
      history
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createTaskReview,
  getTaskReviews,
  getTaskReviewById,
  createReviewAndApplyDecision
};