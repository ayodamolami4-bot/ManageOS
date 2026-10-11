const {
  assignTask,
  getTaskAssignmentHistory,
  endAssignment,
  reassignAssignment
} = require("../services/taskAssignmentService");

async function createAssignment(
  req,
  res
) {
  try {
    const assignment =
      await assignTask(
        {
          taskId:
            req.params.taskId,
          userId:
            req.body.userId,
          estimatedEffortHours:
            req.body.estimatedEffortHours
        },
        req.user
      );

    res.status(201).json({
      data: assignment,
      message:
        "Task assigned successfully"
    });
  } catch (error) {
    console.error(
      "Task assignment failed:",
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
      "USER_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "USER_NOT_FOUND",
          message:
            "User not found in your company"
        }
      });
    }

    if (
      error.message ===
      "USER_NOT_PROJECT_MEMBER"
    ) {
      return res.status(409).json({
        error: {
          code:
            "USER_NOT_PROJECT_MEMBER",
          message:
            "User must be a member of the project before receiving a task"
        }
      });
    }

    if (error.message === "EMPLOYEE_UNIT_MEMBERSHIP_REQUIRED") {
      return res.status(409).json({
        error: {
          code: "EMPLOYEE_UNIT_MEMBERSHIP_REQUIRED",
          message: "Add this employee to an eligible organization unit before assigning work"
        }
      });
    }

    if (error.message === "TASK_NOT_ASSIGNABLE") {
      return res.status(409).json({
        error: {
          code: "TASK_NOT_ASSIGNABLE",
          message: "Task cannot be assigned during review or after completion"
        }
      });
    }

    if (
      error.message ===
      "TASK_ALREADY_ASSIGNED"
    ) {
      return res.status(409).json({
        error: {
          code:
            "TASK_ALREADY_ASSIGNED",
          message:
            "Task already has an active assignee"
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
            "You do not have permission to assign this task"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "TASK_ASSIGNMENT_FAILED",
        message:
          "Unable to assign task"
      }
    });
  }
}

async function getAssignments(
  req,
  res
) {
  try {
    const assignments =
      await getTaskAssignmentHistory(
        req.params.taskId,
        req.user
      );

    res.status(200).json({
      data: assignments,
      message:
        "Task assignments retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Task assignment retrieval failed:",
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
            "You do not have access to this task"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "TASK_ASSIGNMENT_RETRIEVAL_FAILED",
        message:
          "Unable to retrieve task assignments"
      }
    });
  }
}

async function endTaskAssignment(
  req,
  res
) {
  try {
    const assignment =
      await endAssignment(
        req.params.assignmentId,
        req.user
      );

    res.status(200).json({
      data: assignment,
      message:
        "Task assignment ended successfully"
    });
  } catch (error) {
    console.error(
      "Ending task assignment failed:",
      error
    );

    if (
      error.message ===
      "ASSIGNMENT_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "ASSIGNMENT_NOT_FOUND",
          message:
            "Active task assignment not found"
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
            "You do not have permission to end this task assignment"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "TASK_ASSIGNMENT_END_FAILED",
        message:
          "Unable to end task assignment"
      }
    });
  }
}


async function reassignTask(req, res) {
  try {
    const assignment = await reassignAssignment(
      req.params.assignmentId,
      req.body,
      req.user
    );
    return res.status(200).json({
      data: assignment, message: "Task reassigned successfully",
    });
  } catch (error) {
    const code = error.message;
    if (code === "ASSIGNMENT_NOT_FOUND") {
      return res.status(404).json({
        error: { code, message: "Active assignment not found" },
      });
    }
    if (code === "FORBIDDEN") {
      return res.status(403).json({
        error: { code, message: "You cannot reassign this task" },
      });
    }
    const conflicts = {
      USER_NOT_PROJECT_MEMBER: "Choose a member of the project",
      EMPLOYEE_UNIT_MEMBERSHIP_REQUIRED: "Add the employee to an eligible organization unit first",
      TASK_NOT_ASSIGNABLE: "Work under review or already completed cannot be reassigned",
      ASSIGNMENT_ALREADY_OWNED: "This person is already assigned",
    };
    if (conflicts[code]) {
      return res.status(409).json({ error: { code, message: conflicts[code] } });
    }
    console.error("Task reassignment failed:", error);
    return res.status(500).json({
      error: { code: "TASK_REASSIGNMENT_FAILED", message: "Unable to reassign task" },
    });
  }
}

module.exports = {
  createAssignment,
  getAssignments,
  endTaskAssignment,
  reassignTask
};