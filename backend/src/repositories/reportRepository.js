const pool = require("../db/database");

async function createReport({
  taskId,
  createdBy,
  progressPercentage,
  content
}) {
  const result = await pool.query(
    `
    INSERT INTO reports (
      task_id,
      created_by,
      progress_percentage,
      content
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [
      taskId,
      createdBy,
      progressPercentage,
      content
    ]
  );

  return result.rows[0];
}

async function getTaskReports(taskId) {
  const result = await pool.query(
    `
    SELECT
      id,
      task_id,
      created_by,
      progress_percentage,
      content,
      created_at,
      updated_at
    FROM reports
    WHERE task_id = $1
    ORDER BY created_at DESC
    `,
    [taskId]
  );

  return result.rows;
}

async function getReportById(reportId) {
  const result = await pool.query(
    `
    SELECT
      id,
      task_id,
      created_by,
      progress_percentage,
      content,
      created_at,
      updated_at
    FROM reports
    WHERE id = $1
    LIMIT 1
    `,
    [reportId]
  );

  return result.rows[0];
}

module.exports = {
  createReport,
  getTaskReports,
  getReportById
};