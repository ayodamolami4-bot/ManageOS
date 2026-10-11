const {
  createNewGoal,
  getCompanyGoals,
  getGoal,
  updateExistingGoal,
  deleteExistingGoal
} = require("../services/goalService");

async function createGoal(req, res) {
  try {
    const goal = await createNewGoal(
      {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
        startDate: req.body.startDate,
        dueDate: req.body.dueDate
      },
      req.user
    );

    res.status(201).json({
      data: goal,
      message: "Goal created successfully"
    });
  } catch (error) {
    console.error("Goal creation failed:", error);

    res.status(500).json({
      error: {
        code: "GOAL_CREATION_FAILED",
        message: "Unable to create goal"
      }
    });
  }
}

async function getGoals(req, res) {
  try {
    const goals = await getCompanyGoals(req.user);

    res.status(200).json({
      data: goals,
      message: "Goals retrieved successfully"
    });
  } catch (error) {
    console.error("Goal retrieval failed:", error);

    res.status(500).json({
      error: {
        code: "GOAL_RETRIEVAL_FAILED",
        message: "Unable to retrieve goals"
      }
    });
  }
}

async function getGoalById(req, res) {
  try {
    const goal = await getGoal(
      req.params.goalId,
      req.user
    );

    res.status(200).json({
      data: goal,
      message: "Goal retrieved successfully"
    });
  } catch (error) {
    console.error("Goal retrieval failed:", error);

    if (error.message === "GOAL_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "GOAL_NOT_FOUND",
          message: "Goal not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "GOAL_RETRIEVAL_FAILED",
        message: "Unable to retrieve goal"
      }
    });
  }
}

async function updateGoal(req, res) {
  try {
    const goal = await updateExistingGoal(
      {
        goalId: req.params.goalId,
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
        startDate: req.body.startDate,
        dueDate: req.body.dueDate
      },
      req.user
    );

    res.status(200).json({
      data: goal,
      message: "Goal updated successfully"
    });
  } catch (error) {
    console.error("Goal update failed:", error);

    if (error.message === "GOAL_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "GOAL_NOT_FOUND",
          message: "Goal not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "GOAL_UPDATE_FAILED",
        message: "Unable to update goal"
      }
    });
  }
}

async function deleteGoal(req, res) {
  try {
    await deleteExistingGoal(
      req.params.goalId,
      req.user
    );

    res.status(200).json({
      data: null,
      message: "Goal deleted successfully"
    });
  } catch (error) {
    console.error("Goal deletion failed:", error);

    if (error.message === "GOAL_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "GOAL_NOT_FOUND",
          message: "Goal not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "GOAL_DELETION_FAILED",
        message: "Unable to delete goal"
      }
    });
  }
}

module.exports = {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal
};