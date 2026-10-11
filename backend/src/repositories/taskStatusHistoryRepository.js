const pool = require("../db/database");

async function createTaskStatusHistory({
  taskId,
  previousStatus,
  newStatus,
  changedBy
}) {
  const result = await pool.query(
    `
    INSERT INTO task_status_history (
      task_id,
      previous_status,
      new_status,
      changed_by
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [
      taskId,
      previousStatus,
      newStatus,
      changedBy
    ]
  );

  return result.rows[0];
}

async function getTaskStatusHistory(taskId) {
  const result = await pool.query(
    `
    SELECT
      id,
      task_id,
      previous_status,
      new_status,
      changed_by,
      created_at
    FROM task_status_history
    WHERE task_id = $1
    ORDER BY created_at ASC
    `,
    [taskId]
  );

  return result.rows;
}

module.exports = {
  createTaskStatusHistory,
  getTaskStatusHistory
};