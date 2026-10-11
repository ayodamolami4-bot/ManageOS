const express = require("express");

const {
  createBlocker,
  getTaskBlockers,
  getBlockerById,
  resolveBlocker
} = require("../controllers/blockerController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/tasks/:taskId/blockers",
  authenticate,
  createBlocker
);

router.get(
  "/tasks/:taskId/blockers",
  authenticate,
  getTaskBlockers
);

router.get(
  "/blockers/:blockerId",
  authenticate,
  getBlockerById
);

router.put(
  "/blockers/:blockerId/resolve",
  authenticate,
  resolveBlocker
);

module.exports = router;