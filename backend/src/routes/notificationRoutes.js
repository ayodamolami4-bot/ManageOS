const express = require("express");

const {
  createNotification,
  getUserNotifications,
  getNotificationById,
  markAsRead
} = require("../controllers/notificationController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/notifications",
  authenticate,
  createNotification
);

router.get(
  "/notifications",
  authenticate,
  getUserNotifications
);

router.get(
  "/notifications/:notificationId",
  authenticate,
  getNotificationById
);

router.put(
  "/notifications/:notificationId/read",
  authenticate,
  markAsRead
);

module.exports = router;