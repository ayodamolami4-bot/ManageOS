const {
  createNewNotification,
  getNotifications,
  getNotification,
  readNotification
} = require("../services/notificationService");

async function createNotification(req, res) {
  try {
  const notification = await createNewNotification({
  recipientId: req.body.recipientId,
  type: req.body.type,
  title: req.body.title,
  message: req.body.message,
  resourceType: req.body.resourceType,
  resourceId: req.body.resourceId
}, req.user);
    res.status(201).json({
      data: notification,
      message: "Notification created successfully"
    });
  } catch (error) {
    console.error(
      "Notification creation failed:",
      error
    );

    if (error.message === "RECIPIENT_REQUIRED") {
      return res.status(422).json({
        error: {
          code: "RECIPIENT_REQUIRED",
          message: "Notification recipient is required"
        }
      });
    }

    if (error.message === "NOTIFICATION_TYPE_REQUIRED") {
      return res.status(422).json({
        error: {
          code: "NOTIFICATION_TYPE_REQUIRED",
          message: "Notification type is required"
        }
      });
    }

    if (error.message === "NOTIFICATION_TITLE_REQUIRED") {
      return res.status(422).json({
        error: {
          code: "NOTIFICATION_TITLE_REQUIRED",
          message: "Notification title is required"
        }
      });
    }

    if (error.message === "NOTIFICATION_MESSAGE_REQUIRED") {
      return res.status(422).json({
        error: {
          code: "NOTIFICATION_MESSAGE_REQUIRED",
          message: "Notification message is required"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "NOTIFICATION_CREATION_FAILED",
        message: "Unable to create notification"
      }
    });
  }
}

async function getUserNotifications(req, res) {
  try {
    const notifications =
      await getNotifications(req.user);

    res.status(200).json({
      data: notifications,
      message: "Notifications retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Notification retrieval failed:",
      error
    );

    res.status(500).json({
      error: {
        code: "NOTIFICATIONS_RETRIEVAL_FAILED",
        message: "Unable to retrieve notifications"
      }
    });
  }
}

async function getNotificationById(req, res) {
  try {
    const notification =
      await getNotification(
        req.params.notificationId,
        req.user
      );

    res.status(200).json({
      data: notification,
      message: "Notification retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Notification retrieval failed:",
      error
    );

    if (error.message === "NOTIFICATION_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "NOTIFICATION_NOT_FOUND",
          message: "Notification not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "NOTIFICATION_RETRIEVAL_FAILED",
        message: "Unable to retrieve notification"
      }
    });
  }
}

async function markAsRead(req, res) {
  try {
    const notification =
      await readNotification(
        req.params.notificationId,
        req.user
      );

    res.status(200).json({
      data: notification,
      message: "Notification marked as read"
    });
  } catch (error) {
    console.error(
      "Notification read operation failed:",
      error
    );

    if (error.message === "NOTIFICATION_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "NOTIFICATION_NOT_FOUND",
          message: "Notification not found"
        }
      });
    }
    if (error.message === "RECIPIENT_NOT_FOUND") {
  return res.status(404).json({
    error: {
      code: "RECIPIENT_NOT_FOUND",
      message: "Notification recipient not found"
    }
  });
}

    res.status(500).json({
      error: {
        code: "NOTIFICATION_READ_FAILED",
        message: "Unable to mark notification as read"
      }
    });
  }
}

module.exports = {
  createNotification,
  getUserNotifications,
  getNotificationById,
  markAsRead
};