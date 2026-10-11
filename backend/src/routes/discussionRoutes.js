const express = require("express");

const {
  createDiscussion,
  getAllDiscussions,
  getDiscussionById,
  getResourceDiscussions
} = require("../controllers/discussionController");

const { authenticate } = require("../middleware/authMiddleware");

const { validateBody, validateParams } = require("../middleware/validate");
const {
  discussionIdParams,
  discussionCreateBody
} = require("../validators/discussionSchemas");

const router = express.Router();

router.post(
  "/discussions",
  authenticate,
  validateBody(discussionCreateBody),
  createDiscussion
);

router.get(
  "/discussions",
  authenticate,
  getAllDiscussions
);

router.get(
  "/discussions/:discussionId",
  authenticate,
  validateParams(discussionIdParams),
  getDiscussionById
);

router.get(
  "/resources/:resourceType/:resourceId/discussions",
  authenticate,
  getResourceDiscussions
);

module.exports = router;