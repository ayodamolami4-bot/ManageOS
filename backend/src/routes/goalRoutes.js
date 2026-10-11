const express = require("express");

const {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal
} = require("../controllers/goalController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const {
  requireGoalView,
  requireGoalManagement
} = require("../middleware/goalAuthorization");

const router = express.Router();

router.post(
  "/",
  authenticate,
  requireGoalManagement,
  createGoal
);

router.get(
  "/",
  authenticate,
  requireGoalView,
  getGoals
);

router.get(
  "/:goalId",
  authenticate,
  requireGoalView,
  getGoalById
);

router.put(
  "/:goalId",
  authenticate,
  requireGoalManagement,
  updateGoal
);

router.delete(
  "/:goalId",
  authenticate,
  requireGoalManagement,
  deleteGoal
);

module.exports = router;