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

const {
  listGoalProjects, linkGoalProject, unlinkGoalProject,
} = require("../controllers/goalProjectController");

const goalProjectBody = z.object({ projectId: z.string().uuid("Invalid project reference") }).strict();
const goalProjectParams = z.object({
  goalId: z.string().uuid("Invalid goal reference"),
  projectId: z.string().uuid("Invalid project reference"),
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

router.get("/:goalId/projects",
  authenticate, validateParams(goalIdSchema), requireGoalView, listGoalProjects);
router.post("/:goalId/projects",
  authenticate, validateParams(goalIdSchema), validateBody(goalProjectBody),
  requireGoalManagement, linkGoalProject);
router.delete("/:goalId/projects/:projectId",
  authenticate, validateParams(goalProjectParams), requireGoalManagement, unlinkGoalProject);

module.exports = router;