const {
  createReview,
  getReviews,
  getReview
} = require("../services/taskReviewService");

async function createTaskReview(
  req,
  res
) {
  try {
    const result =
      await createReview(
        {
          submissionId:
            req.params.submissionId,
          decision:
            req.body.decision,
          comment:
            req.body.comment
        },
        req.user
      );

    res.status(201).json({
      data: result,
      message:
        "Task review completed successfully"
    });
  } catch (error) {
    console.error(
      "Task review creation failed:",
      error
    );

    if (
      error.message ===
      "SUBMISSION_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "SUBMISSION_NOT_FOUND",
          message:
            "Task submission not found"
        }
      });
    }

    if (
      error.message ===
      "FORBIDDEN"
    ) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message:
            "You do not have permission to review this task"
        }
      });
    }

    if (
      error.message ===
      "SUBMISSION_NOT_READY_FOR_REVIEW"
    ) {
      return res.status(422).json({
        error: {
          code:
            "SUBMISSION_NOT_READY_FOR_REVIEW",
          message:
            "Task submission is not ready for review"
        }
      });
    }

    if (
      error.message ===
      "INVALID_REVIEW_DECISION"
    ) {
      return res.status(422).json({
        error: {
          code:
            "INVALID_REVIEW_DECISION",
          message:
            "Review decision must be APPROVED or NEEDS_CHANGES"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "TASK_REVIEW_FAILED",
        message:
          "Unable to complete task review"
      }
    });
  }
}

async function getTaskReviews(
  req,
  res
) {
  try {
    const reviews =
      await getReviews(
        req.params.submissionId,
        req.user
      );

    res.status(200).json({
      data: reviews,
      message:
        "Task reviews retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Task review retrieval failed:",
      error
    );

    if (
      error.message ===
      "SUBMISSION_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "SUBMISSION_NOT_FOUND",
          message:
            "Task submission not found"
        }
      });
    }

    if (
      error.message ===
      "FORBIDDEN"
    ) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message:
            "You do not have access to reviews for this task"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "TASK_REVIEWS_RETRIEVAL_FAILED",
        message:
          "Unable to retrieve task reviews"
      }
    });
  }
}

async function getTaskReview(
  req,
  res
) {
  try {
    const review =
      await getReview(
        req.params.reviewId,
        req.user
      );

    res.status(200).json({
      data: review,
      message:
        "Task review retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Task review retrieval failed:",
      error
    );

    if (
      error.message ===
      "REVIEW_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "REVIEW_NOT_FOUND",
          message:
            "Task review not found"
        }
      });
    }

    if (
      error.message ===
      "FORBIDDEN"
    ) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message:
            "You do not have access to this review"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "TASK_REVIEW_RETRIEVAL_FAILED",
        message:
          "Unable to retrieve task review"
      }
    });
  }
}

module.exports = {
  createTaskReview,
  getTaskReviews,
  getTaskReview
};