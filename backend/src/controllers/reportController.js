const {
  createTaskReport,
  getReportsForTask,
  getReport
} = require("../services/reportService");

async function createReport(req, res) {
  try {
    const report = await createTaskReport(
      {
        taskId: req.params.taskId,
        progressPercentage: req.body.progressPercentage,
        content: req.body.content
      },
      req.user
    );

    res.status(201).json({
      data: report,
      message: "Task progress report created successfully"
    });
  } catch (error) {
    console.error("Report creation failed:", error);

    if (error.message === "FORBIDDEN") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access these task reports"
        }
      });
    }



    if (error.message === "TASK_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "TASK_NOT_FOUND",
          message: "Task not found"
        }
      });
    }

    if (error.message === "INVALID_PROGRESS_PERCENTAGE") {
      return res.status(422).json({
        error: {
          code: "INVALID_PROGRESS_PERCENTAGE",
          message: "Progress percentage must be an integer between 0 and 100"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "REPORT_CREATION_FAILED",
        message: "Unable to create progress report"
      }
    });
  }
}

async function getTaskReports(req, res) {
  try {
    const reports = await getReportsForTask(
      req.params.taskId,
      req.user
    );

    res.status(200).json({
      data: reports,
      message: "Task progress reports retrieved successfully"
    });
  } catch (error) {
    console.error("Report retrieval failed:", error);

    if (error.message === "FORBIDDEN") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access these task reports"
        }
      });
    }



    if (error.message === "TASK_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "TASK_NOT_FOUND",
          message: "Task not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "REPORTS_RETRIEVAL_FAILED",
        message: "Unable to retrieve progress reports"
      }
    });
  }
}

async function getReportById(req, res) {
  try {
    const report = await getReport(
      req.params.reportId,
      req.user
    );

    res.status(200).json({
      data: report,
      message: "Task progress report retrieved successfully"
    });
  } catch (error) {
    console.error("Report retrieval failed:", error);

    if (error.message === "FORBIDDEN") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access these task reports"
        }
      });
    }



    if (error.message === "REPORT_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "REPORT_NOT_FOUND",
          message: "Progress report not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "REPORT_RETRIEVAL_FAILED",
        message: "Unable to retrieve progress report"
      }
    });
  }
}

module.exports = {
  createReport,
  getTaskReports,
  getReportById
};