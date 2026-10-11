const pool = require("../db/database");

async function createTaskAssignment({
  taskId,
  userId,
  assignedBy,
  estimatedEffortHours
}) {
  const result = await pool.query(
    `
    INSERT INTO task_assignments (
      task_id,
      user_id,
      assigned_by,
      estimated_effort_hours
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [
      taskId,
      userId,
      assignedBy,
      estimatedEffortHours
    ]
  );

  return result.rows[0];
}

async function getActiveTaskAssignment(taskId) {
  const result = await pool.query(
    `
    SELECT
      id,
      task_id,
      user_id,
      assigned_by,
      estimated_effort_hours,
      assigned_at,
      ended_at
    FROM task_assignments
    WHERE task_id = $1
      AND ended_at IS NULL
    LIMIT 1
    `,
    [taskId]
  );

  return result.rows[0];
}

async function getTaskAssignments(taskId) {
  const result = await pool.query(
    `
    SELECT
      id,
      task_id,
      user_id,
      assigned_by,
      estimated_effort_hours,
      assigned_at,
      ended_at
    FROM task_assignments
    WHERE task_id = $1
    ORDER BY assigned_at DESC
    `,
    [taskId]
  );

  return result.rows;
}

async function endTaskAssignment(
  assignmentId,
  endedAt
) {
  const result = await pool.query(
    `
    UPDATE task_assignments
    SET ended_at = $1
    WHERE id = $2
      AND ended_at IS NULL
    RETURNING *
    `,
    [endedAt, assignmentId]
  );

  return result.rows[0];
}

module.exports = {
  createTaskAssignment,
  getActiveTaskAssignment,
  getTaskAssignments,
  endTaskAssignment
};