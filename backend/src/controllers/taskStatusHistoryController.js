const {
  getStatusHistory
} = require("../services/taskStatusHistoryService");

async function getTaskStatusHistory(
  req,
  res
) {
  try {
    const history =
      await getStatusHistory(
        req.params.taskId,
        req.user
      );

    res.status(200).json({
      data: history,
      message:
        "Task status history retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Status history retrieval failed:",
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
            "You do not have access to this task's status history"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "TASK_STATUS_HISTORY_RETRIEVAL_FAILED",
        message:
          "Unable to retrieve task status history"
      }
    });
  }
}

module.exports = {
  getTaskStatusHistory
};