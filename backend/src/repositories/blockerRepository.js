const pool = require("../db/database");

async function createBlocker({
  taskId,
  reportedBy,
  title,
  description
}) {
  const result = await pool.query(
    `
    INSERT INTO blockers (
      task_id,
      reported_by,
      title,
      description
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [
      taskId,
      reportedBy,
      title,
      description
    ]
  );

  return result.rows[0];
}

async function getTaskBlockers(taskId) {
  const result = await pool.query(
    `
    SELECT
      id,
      task_id,
      reported_by,
      title,
      description,
      status,
      resolved_by,
      resolved_at,
      created_at
    FROM blockers
    WHERE task_id = $1
    ORDER BY created_at DESC
    `,
    [taskId]
  );

  return result.rows;
}

async function getBlockerById(blockerId) {
  const result = await pool.query(
    `
    SELECT
      id,
      task_id,
      reported_by,
      title,
      description,
      status,
      resolved_by,
      resolved_at,
      created_at
    FROM blockers
    WHERE id = $1
    LIMIT 1
    `,
    [blockerId]
  );

  return result.rows[0];
}

async function resolveBlocker(blockerId, resolvedBy) {
  const result = await pool.query(
    `
    UPDATE blockers
    SET
      status = 'RESOLVED',
      resolved_by = $1,
      resolved_at = NOW()
    WHERE id = $2
      AND status = 'OPEN'
    RETURNING *
    `,
    [resolvedBy, blockerId]
  );

  return result.rows[0];
}

module.exports = {
  createBlocker,
  getTaskBlockers,
  getBlockerById,
  resolveBlocker
};