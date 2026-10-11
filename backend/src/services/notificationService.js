const {
  createNotification,
  getUserNotifications,
  getNotificationById,
  markNotificationAsRead
} = require("../repositories/notificationRepository");

const pool = require("../db/database");

async function verifyRecipientBelongsToCompany(
  recipientId,
  companyId
) {
  const result = await pool.query(
    `
    SELECT id
    FROM users
    WHERE id = $1
      AND company_id = $2
    LIMIT 1
    `,
    [recipientId, companyId]
  );

  if (!result.rows[0]) {
    throw new Error("RECIPIENT_NOT_FOUND");
  }
}

async function createNewNotification({
  recipientId,
  type,
  title,
  message,
  resourceType,
  resourceId
}, user) {
  if (!recipientId) {
    throw new Error("RECIPIENT_REQUIRED");
  }

  await verifyRecipientBelongsToCompany(
    recipientId,
    user.company_id
  );

  if (!type || !type.trim()) {
    throw new Error("NOTIFICATION_TYPE_REQUIRED");
  }

  if (!title || !title.trim()) {
    throw new Error("NOTIFICATION_TITLE_REQUIRED");
  }

  if (!message || !message.trim()) {
    throw new Error("NOTIFICATION_MESSAGE_REQUIRED");
  }

  return await createNotification({
    recipientId,
    type: type.trim(),
    title: title.trim(),
    message: message.trim(),
    resourceType,
    resourceId
  });
}

async function getNotifications(user) {
  return await getUserNotifications(user.id);
}

async function getNotification(
  notificationId,
  user
) {
  const notification =
    await getNotificationById(notificationId);

  if (
    !notification ||
    notification.recipient_id !== user.id
  ) {
    throw new Error("NOTIFICATION_NOT_FOUND");
  }

  return notification;
}

async function readNotification(
  notificationId,
  user
) {
  const notification =
    await getNotification(
      notificationId,
      user
    );

  if (notification.read_at) {
    return notification;
  }

  return await markNotificationAsRead(
    notificationId
  );
}

module.exports = {
  createNewNotification,
  getNotifications,
  getNotification,
  readNotification
};