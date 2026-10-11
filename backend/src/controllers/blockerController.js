const {
  createTaskBlocker,
  getBlockersForTask,
  getBlocker,
  resolveTaskBlocker
} = require("../services/blockerService");

async function createBlocker(req, res) {
  try {
    const blocker = await createTaskBlocker(
      {
        taskId: req.params.taskId,
        title: req.body.title,
        description: req.body.description
      },
      req.user
    );

    res.status(201).json({
      data: blocker,
      message: "Task blocker created successfully"
    });
  } catch (error) {
    console.error("Blocker creation failed:", error);

    if (error.message === "TASK_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "TASK_NOT_FOUND",
          message: "Task not found"
        }
      });
    }

    if (error.message === "BLOCKER_TITLE_REQUIRED") {
      return res.status(422).json({
        error: {
          code: "BLOCKER_TITLE_REQUIRED",
          message: "Blocker title is required"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "BLOCKER_CREATION_FAILED",
        message: "Unable to create task blocker"
      }
    });
  }
}

async function getTaskBlockers(req, res) {
  try {
    const blockers = await getBlockersForTask(
      req.params.taskId,
      req.user
    );

    res.status(200).json({
      data: blockers,
      message: "Task blockers retrieved successfully"
    });
  } catch (error) {
    console.error("Blocker retrieval failed:", error);

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
        code: "BLOCKERS_RETRIEVAL_FAILED",
        message: "Unable to retrieve task blockers"
      }
    });
  }
}

async function getBlockerById(req, res) {
  try {
    const blocker = await getBlocker(
      req.params.blockerId,
      req.user
    );

    res.status(200).json({
      data: blocker,
      message: "Task blocker retrieved successfully"
    });
  } catch (error) {
    console.error("Blocker retrieval failed:", error);

    if (error.message === "BLOCKER_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "BLOCKER_NOT_FOUND",
          message: "Task blocker not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "BLOCKER_RETRIEVAL_FAILED",
        message: "Unable to retrieve task blocker"
      }
    });
  }
}

async function resolveBlocker(req, res) {
  try {
    const blocker = await resolveTaskBlocker(
      req.params.blockerId,
      req.user
    );

    res.status(200).json({
      data: blocker,
      message: "Task blocker resolved successfully"
    });
  } catch (error) {
    console.error("Blocker resolution failed:", error);

    if (error.message === "BLOCKER_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "BLOCKER_NOT_FOUND",
          message: "Task blocker not found"
        }
      });
    }

    if (error.message === "BLOCKER_ALREADY_RESOLVED") {
      return res.status(409).json({
        error: {
          code: "BLOCKER_ALREADY_RESOLVED",
          message: "Task blocker is already resolved"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "BLOCKER_RESOLUTION_FAILED",
        message: "Unable to resolve task blocker"
      }
    });
  }
}

module.exports = {
  createBlocker,
  getTaskBlockers,
  getBlockerById,
  resolveBlocker
};