const express = require("express");

const {
  createComment,
  getDiscussionComments,
  getCommentById
} = require("../controllers/commentController");

const { authenticate } = require("../middleware/authMiddleware");

const { validateBody, validateParams } = require("../middleware/validate");
const {
  discussionIdParams,
  commentCreateBody
} = require("../validators/discussionSchemas");

const router = express.Router();

router.post(
  "/discussions/:discussionId/comments",
  authenticate,
  validateParams(discussionIdParams),
  validateBody(commentCreateBody),
  createComment
);

router.get(
  "/discussions/:discussionId/comments",
  authenticate,
  validateParams(discussionIdParams),
  getDiscussionComments
);

router.get(
  "/comments/:commentId",
  authenticate,
  getCommentById
);

module.exports = router;