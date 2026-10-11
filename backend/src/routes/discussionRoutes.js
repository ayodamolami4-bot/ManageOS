const express = require("express");

const {
  createDiscussion,
  getAllDiscussions,
  getDiscussionById,
  getResourceDiscussions
} = require("../controllers/discussionController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/discussions",
  authenticate,
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
  getDiscussionById
);

router.get(
  "/resources/:resourceType/:resourceId/discussions",
  authenticate,
  getResourceDiscussions
);

module.exports = router;