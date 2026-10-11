const express = require("express");

const {
  createAssignment,
  getAssignments,
  endTaskAssignment
} = require("../controllers/taskAssignmentController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const {
  requireTaskManagement,
  requireTaskView
} = require("../middleware/taskAuthorization");

const router = express.Router();

router.post(
  "/tasks/:taskId/assignments",
  authenticate,
  requireTaskManagement,
  createAssignment
);

router.get(
  "/tasks/:taskId/assignments",
  authenticate,
  requireTaskView,
  getAssignments
);

router.put(
  "/task-assignments/:assignmentId/end",
  authenticate,
  endTaskAssignment
);

module.exports = router;