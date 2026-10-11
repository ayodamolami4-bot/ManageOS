const express = require("express");

const {
  createMilestone,
  getMilestones,
  getMilestoneById,
  updateMilestone,
  deleteMilestone
} = require("../controllers/milestoneController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const {
  requireProjectView,
  requireProjectManagement
} = require("../middleware/projectAuthorization");

const { validateBody, validateParams } = require("../middleware/validate");
const {
  createMilestoneSchema,
  updateMilestoneSchema,
  projectMilestoneParamsSchema
} = require("../validators/milestoneSchemas");

const router = express.Router();

router.post(
  "/projects/:projectId/milestones",
  authenticate,
  validateParams(projectMilestoneParamsSchema),
  validateBody(createMilestoneSchema),
  requireProjectManagement,
  createMilestone
);

router.get(
  "/projects/:projectId/milestones",
  authenticate,
  validateParams(projectMilestoneParamsSchema),
  requireProjectView,
  getMilestones
);

router.get(
  "/projects/:projectId/milestones/:milestoneId",
  authenticate,
  validateParams(projectMilestoneParamsSchema),
  requireProjectView,
  getMilestoneById
);

router.put(
  "/projects/:projectId/milestones/:milestoneId",
  authenticate,
  validateParams(projectMilestoneParamsSchema),
  validateBody(updateMilestoneSchema),
  requireProjectManagement,
  updateMilestone
);

router.delete(
  "/projects/:projectId/milestones/:milestoneId",
  authenticate,
  validateParams(projectMilestoneParamsSchema),
  requireProjectManagement,
  deleteMilestone
);

module.exports = router;