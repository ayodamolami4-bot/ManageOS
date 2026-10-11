const express = require("express");

const {
  createTaskReview,
  getTaskReviews,
  getTaskReview
} = require("../controllers/taskReviewController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/task-submissions/:submissionId/reviews",
  authenticate,
  createTaskReview
);

router.get(
  "/task-submissions/:submissionId/reviews",
  authenticate,
  getTaskReviews
);

router.get(
  "/task-reviews/:reviewId",
  authenticate,
  getTaskReview
);

module.exports = router;