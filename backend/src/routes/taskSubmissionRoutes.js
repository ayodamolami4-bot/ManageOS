const express = require("express");

const {
  createTaskSubmission,
  getTaskSubmissions,
  getTaskSubmission
} = require("../controllers/taskSubmissionController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const { validateBody, validateParams } = require("../middleware/validate");
const { taskParams, submissionParams, submissionBody } = require("../validators/taskOperationsSchemas");

const router = express.Router();

router.post(
  "/tasks/:taskId/submissions",
  authenticate,
  validateParams(taskParams),
  validateBody(submissionBody),
  createTaskSubmission
);

router.get(
  "/tasks/:taskId/submissions",
  authenticate,
  validateParams(taskParams),
  getTaskSubmissions
);

router.get(
  "/task-submissions/:submissionId",
  authenticate,
  validateParams(submissionParams),
  getTaskSubmission
);

module.exports = router;