const {
  canViewTask,
  canManageTask,
  canCreateTask,
  canChangeTaskStatus
} = require("../services/authorizationService");

async function requireTaskCreation(req, res, next) {
  try {
    const allowed = await canCreateTask(
      req.user,
      req.body.projectId
    );

    if (!allowed) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message:
            "You do not have permission to create a task in this project"
        }
      });
    }

    next();
  } catch (error) {
    console.error(
      "Task creation authorization failed:",
      error
    );

    res.status(500).json({
      error: {
        code: "AUTHORIZATION_FAILED",
        message:
          "Unable to verify task creation access"
      }
    });
  }
}

async function requireTaskView(req, res, next) {
  try {
    const allowed = await canViewTask(
      req.user,
      req.params.taskId
    );

    if (!allowed) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message:
            "You do not have access to this task"
        }
      });
    }

    next();
  } catch (error) {
    console.error(
      "Task view authorization failed:",
      error
    );

    res.status(500).json({
      error: {
        code: "AUTHORIZATION_FAILED",
        message:
          "Unable to verify task access"
      }
    });
  }
}

async function requireTaskManagement(req, res, next) {
  try {
    const allowed = await canManageTask(
      req.user,
      req.params.taskId
    );

    if (!allowed) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message:
            "You do not have permission to manage this task"
        }
      });
    }

    next();
  } catch (error) {
    console.error(
      "Task management authorization failed:",
      error
    );

    res.status(500).json({
      error: {
        code: "AUTHORIZATION_FAILED",
        message:
          "Unable to verify task management access"
      }
    });
  }
}

async function requireTaskStatusChange(req, res, next) {
  try {
    const allowed = await canChangeTaskStatus(
      req.user,
      req.params.taskId,
      req.body.newStatus
    );

    if (!allowed) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message:
            "You are not permitted to make this task status change"
        }
      });
    }

    next();
  } catch (error) {
    console.error(
      "Task status authorization failed:",
      error
    );

    res.status(500).json({
      error: {
        code: "AUTHORIZATION_FAILED",
        message:
          "Unable to verify task status access"
      }
    });
  }
}

module.exports = {
  requireTaskCreation,
  requireTaskView,
  requireTaskManagement,
  requireTaskStatusChange
};