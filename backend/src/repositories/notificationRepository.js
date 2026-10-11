const pool = require("../db/database");

async function createNotification({
  recipientId,
  type,
  title,
  message,
  resourceType,
  resourceId
}) {
  const result = await pool.query(
    `
    INSERT INTO notifications (
      recipient_id,
      type,
      title,
      message,
      resource_type,
      resource_id
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      recipientId,
      type,
      title,
      message,
      resourceType,
      resourceId
    ]
  );

  return result.rows[0];
}

async function getUserNotifications(
  recipientId
) {
  const result = await pool.query(
    `
    SELECT
      id,
      recipient_id,
      type,
      title,
      message,
      resource_type,
      resource_id,
      created_at,
      read_at
    FROM notifications
    WHERE recipient_id = $1
    ORDER BY created_at DESC
    `,
    [recipientId]
  );

  return result.rows;
}

async function getNotificationById(
  notificationId
) {
  const result = await pool.query(
    `
    SELECT
      id,
      recipient_id,
      type,
      title,
      message,
      resource_type,
      resource_id,
      created_at,
      read_at
    FROM notifications
    WHERE id = $1
    LIMIT 1
    `,
    [notificationId]
  );

  return result.rows[0];
}

async function markNotificationAsRead(
  notificationId
) {
  const result = await pool.query(
    `
    UPDATE notifications
    SET
      read_at = NOW()
    WHERE id = $1
      AND read_at IS NULL
    RETURNING *
    `,
    [notificationId]
  );

  return result.rows[0];
}
async function createNotificationWithClient(
  client,
  {
    recipientId,
    type,
    title,
    message,
    resourceType,
    resourceId
  }
) {
  const result = await client.query(
    `
    INSERT INTO notifications (
      recipient_id,
      type,
      title,
      message,
      resource_type,
      resource_id
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      recipientId,
      type,
      title,
      message,
      resourceType,
      resourceId
    ]
  );

  return result.rows[0];
}

module.exports = {
  createNotification,
    createNotificationWithClient,
  getUserNotifications,
  getNotificationById,
  markNotificationAsRead
};