const express = require("express");

const {
  createAssignment,
  getAssignments,
  endTaskAssignment,
  reassignTask
} = require("../controllers/taskAssignmentController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const {
  requireTaskManagement,
  requireTaskView
} = require("../middleware/taskAuthorization");

const { validateBody, validateParams } = require("../middleware/validate");
const { taskParams, assignmentParams, assignmentBody } = require("../validators/taskOperationsSchemas");

const router = express.Router();

router.post(
  "/tasks/:taskId/assignments",
  authenticate,
  validateParams(taskParams),
  validateBody(assignmentBody),
  requireTaskManagement,
  createAssignment
);

router.get(
  "/tasks/:taskId/assignments",
  authenticate,
  validateParams(taskParams),
  requireTaskView,
  getAssignments
);

router.put(
  "/task-assignments/:assignmentId/end",
  authenticate,
  validateParams(assignmentParams),
  endTaskAssignment
);


router.put(
  "/task-assignments/:assignmentId/reassign",
  authenticate,
  validateParams(assignmentParams),
  validateBody(assignmentBody),
  reassignTask
);

module.exports = router;