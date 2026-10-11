const express = require("express");

const {
  createComment,
  getDiscussionComments,
  getCommentById
} = require("../controllers/commentController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/discussions/:discussionId/comments",
  authenticate,
  createComment
);

router.get(
  "/discussions/:discussionId/comments",
  authenticate,
  getDiscussionComments
);

router.get(
  "/comments/:commentId",
  authenticate,
  getCommentById
);

module.exports = router;