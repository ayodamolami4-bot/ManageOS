const express = require("express");

const {
  createTaskReview,
  getTaskReviews,
  getTaskReview
} = require("../controllers/taskReviewController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const { validateBody, validateParams } = require("../middleware/validate");
const { submissionParams, reviewBody } = require("../validators/taskOperationsSchemas");

const router = express.Router();

router.post(
  "/task-submissions/:submissionId/reviews",
  authenticate,
  validateParams(submissionParams),
  validateBody(reviewBody),
  createTaskReview
);

router.get(
  "/task-submissions/:submissionId/reviews",
  authenticate,
  validateParams(submissionParams),
  getTaskReviews
);

router.get(
  "/task-reviews/:reviewId",
  authenticate,
  getTaskReview
);

module.exports = router;