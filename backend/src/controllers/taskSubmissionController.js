const {
  createSubmission,
  getSubmissions,
  getSubmission
} = require("../services/taskSubmissionService");

async function createTaskSubmission(
  req,
  res
) {
  try {
    const submission =
      await createSubmission(
        {
          taskId:
            req.params.taskId,
          description:
            req.body.description
        },
        req.user
      );

    res.status(201).json({
      data: submission,
      message:
        "Task submitted successfully"
    });
  } catch (error) {
    console.error(
      "Task submission failed:",
      error
    );

    if (
      error.message ===
      "TASK_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "TASK_NOT_FOUND",
          message:
            "Task not found"
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
            "You are not permitted to submit this task"
        }
      });
    }

    if (
      error.message ===
      "TASK_NOT_READY_FOR_SUBMISSION"
    ) {
      return res.status(422).json({
        error: {
          code:
            "TASK_NOT_READY_FOR_SUBMISSION",
          message:
            "Task must be in progress before it can be submitted"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "TASK_SUBMISSION_FAILED",
        message:
          "Unable to submit task"
      }
    });
  }
}

async function getTaskSubmissions(
  req,
  res
) {
  try {
    const submissions =
      await getSubmissions(
        req.params.taskId,
        req.user
      );

    res.status(200).json({
      data: submissions,
      message:
        "Task submissions retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Task submission retrieval failed:",
      error
    );

    if (
      error.message ===
      "TASK_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "TASK_NOT_FOUND",
          message:
            "Task not found"
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
            "You do not have access to submissions for this task"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "TASK_SUBMISSIONS_RETRIEVAL_FAILED",
        message:
          "Unable to retrieve task submissions"
      }
    });
  }
}

async function getTaskSubmission(
  req,
  res
) {
  try {
    const submission =
      await getSubmission(
        req.params.submissionId,
        req.user
      );

    res.status(200).json({
      data: submission,
      message:
        "Task submission retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Task submission retrieval failed:",
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
            "You do not have access to this submission"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "TASK_SUBMISSION_RETRIEVAL_FAILED",
        message:
          "Unable to retrieve task submission"
      }
    });
  }
}

module.exports = {
  createTaskSubmission,
  getTaskSubmissions,
  getTaskSubmission
};