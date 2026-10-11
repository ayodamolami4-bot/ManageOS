const express = require("express");

const {
  createTaskSubmission,
  getTaskSubmissions,
  getTaskSubmission
} = require("../controllers/taskSubmissionController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/tasks/:taskId/submissions",
  authenticate,
  createTaskSubmission
);

router.get(
  "/tasks/:taskId/submissions",
  authenticate,
  getTaskSubmissions
);

router.get(
  "/task-submissions/:submissionId",
  authenticate,
  getTaskSubmission
);

module.exports = router;