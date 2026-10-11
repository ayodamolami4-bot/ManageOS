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

const { z } = require("zod");
const { validateBody, validateParams } = require("../middleware/validate");
const { createGoalSchema, updateGoalSchema } = require("../validators/goalSchemas");

const goalIdSchema = z.object({
  goalId: z.string().uuid("Invalid goal reference")
}).strict();

const router = express.Router();

router.post(
  "/",
  authenticate,
  validateBody(createGoalSchema),
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
  validateParams(goalIdSchema),
  requireGoalView,
  getGoalById
);

router.put(
  "/:goalId",
  authenticate,
  validateParams(goalIdSchema),
  validateBody(updateGoalSchema),
  requireGoalManagement,
  updateGoal
);

router.delete(
  "/:goalId",
  authenticate,
  validateParams(goalIdSchema),
  requireGoalManagement,
  deleteGoal
);

module.exports = router;