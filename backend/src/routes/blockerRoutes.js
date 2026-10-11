const express = require("express");

const {
  createBlocker,
  getTaskBlockers,
  getBlockerById,
  resolveBlocker
} = require("../controllers/blockerController");

const { authenticate } = require("../middleware/authMiddleware");

const { validateBody, validateParams } = require("../middleware/validate");
const { taskParams, blockerParams, blockerBody } = require("../validators/operationalSchemas");

const router = express.Router();

router.post(
  "/tasks/:taskId/blockers",
  authenticate,
  validateParams(taskParams),
  validateBody(blockerBody),
  createBlocker
);

router.get(
  "/tasks/:taskId/blockers",
  authenticate,
  validateParams(taskParams),
  getTaskBlockers
);

router.get(
  "/blockers/:blockerId",
  authenticate,
  validateParams(blockerParams),
  getBlockerById
);

router.put(
  "/blockers/:blockerId/resolve",
  authenticate,
  validateParams(blockerParams),
  resolveBlocker
);

module.exports = router;