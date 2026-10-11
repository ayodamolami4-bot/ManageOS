const express = require("express");

const {
  getTaskStatusHistory
} = require("../controllers/taskStatusHistoryController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const {
  requireTaskView
} = require("../middleware/taskAuthorization");

const router = express.Router();

router.get(
  "/tasks/:taskId/status-history",
  authenticate,
  requireTaskView,
  getTaskStatusHistory
);

module.exports = router;