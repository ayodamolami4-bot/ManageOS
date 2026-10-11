const {
  createNewTask,
  getCompanyTasks,
  getTask,
  updateExistingTask,
  deleteExistingTask
} = require("../services/taskService");

const {
  changeTaskStatus
} = require("../services/taskWorkflowService");

async function createTask(
  req,
  res
) {
  try {
    const task =
      await createNewTask(
        {
          projectId:
            req.body.projectId,

          milestoneId:
            req.body.milestoneId,

          title:
            req.body.title,

          description:
            req.body.description,

          priority:
            req.body.priority,

          dueDate:
            req.body.dueDate
        },
        req.user
      );

    res.status(201).json({
      data: task,
      message:
        "Task created successfully"
    });
  } catch (error) {
    console.error(
      "Task creation failed:",
      error
    );

    if (
      error.message ===
      "PROJECT_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "PROJECT_NOT_FOUND",
          message:
            "Project not found"
        }
      });
    }

    if (
      error.message ===
      "MILESTONE_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "MILESTONE_NOT_FOUND",
          message:
            "Milestone not found in this project"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "TASK_CREATION_FAILED",
        message:
          "Unable to create task"
      }
    });
  }
}

async function getTasks(
  req,
  res
) {
  try {
    const tasks =
      await getCompanyTasks(
        req.user
      );

    res.status(200).json({
      data: tasks,
      message:
        "Tasks retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Task retrieval failed:",
      error
    );

    res.status(500).json({
      error: {
        code:
          "TASK_RETRIEVAL_FAILED",
        message:
          "Unable to retrieve tasks"
      }
    });
  }
}

async function getTaskById(
  req,
  res
) {
  try {
    const task =
      await getTask(
        req.params.taskId,
        req.user
      );

    res.status(200).json({
      data: task,
      message:
        "Task retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Task retrieval failed:",
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

    res.status(500).json({
      error: {
        code:
          "TASK_RETRIEVAL_FAILED",
        message:
          "Unable to retrieve task"
      }
    });
  }
}

async function updateTask(
  req,
  res
) {
  try {
    const task =
      await updateExistingTask(
        {
          taskId:
            req.params.taskId,

          milestoneId:
            req.body.milestoneId,

          title:
            req.body.title,

          description:
            req.body.description,

          priority:
            req.body.priority,

          dueDate:
            req.body.dueDate
        },
        req.user
      );

    res.status(200).json({
      data: task,
      message:
        "Task updated successfully"
    });
  } catch (error) {
    console.error(
      "Task update failed:",
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
      "MILESTONE_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "MILESTONE_NOT_FOUND",
          message:
            "Milestone not found in this project"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "TASK_UPDATE_FAILED",
        message:
          "Unable to update task"
      }
    });
  }
}

async function deleteTask(
  req,
  res
) {
  try {
    await deleteExistingTask(
      req.params.taskId,
      req.user
    );

    res.status(200).json({
      data: null,
      message:
        "Task deleted successfully"
    });
  } catch (error) {
    console.error(
      "Task deletion failed:",
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

    res.status(500).json({
      error: {
        code:
          "TASK_DELETION_FAILED",
        message:
          "Unable to delete task"
      }
    });
  }
}

async function changeStatus(
  req,
  res
) {
  try {
    const result =
      await changeTaskStatus(
        {
          taskId:
            req.params.taskId,

          newStatus:
            req.body.newStatus
        },
        req.user
      );

    res.status(200).json({
      data: result,
      message:
        "Task status changed successfully"
    });
  } catch (error) {
    console.error(
      "Task status change failed:",
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
      "STATUS_UNCHANGED"
    ) {
      return res.status(409).json({
        error: {
          code:
            "STATUS_UNCHANGED",
          message:
            "Task is already in this status"
        }
      });
    }

    if (
      error.message ===
      "INVALID_STATUS"
    ) {
      return res.status(422).json({
        error: {
          code:
            "INVALID_STATUS",
          message:
            "Invalid task status"
        }
      });
    }

    if (
      error.message ===
      "INVALID_STATUS_TRANSITION"
    ) {
      return res.status(422).json({
        error: {
          code:
            "INVALID_STATUS_TRANSITION",
          message:
            "Task cannot move to this status from its current status"
        }
      });
    }

    if (
      error.message ===
      "FORBIDDEN"
    ) {
      return res.status(403).json({
        error: {
          code:
            "FORBIDDEN",
          message:
            "You do not have permission to change this task status"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "TASK_STATUS_CHANGE_FAILED",
        message:
          "Unable to change task status"
      }
    });
  }
}

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  changeStatus
};