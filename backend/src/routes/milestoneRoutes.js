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

const router = express.Router();

router.post(
  "/projects/:projectId/milestones",
  authenticate,
  requireProjectManagement,
  createMilestone
);

router.get(
  "/projects/:projectId/milestones",
  authenticate,
  requireProjectView,
  getMilestones
);

router.get(
  "/projects/:projectId/milestones/:milestoneId",
  authenticate,
  requireProjectView,
  getMilestoneById
);

router.put(
  "/projects/:projectId/milestones/:milestoneId",
  authenticate,
  requireProjectManagement,
  updateMilestone
);

router.delete(
  "/projects/:projectId/milestones/:milestoneId",
  authenticate,
  requireProjectManagement,
  deleteMilestone
);

module.exports = router;