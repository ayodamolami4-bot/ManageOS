const pool = require("../db/database");

async function createGoal({
  companyId,
  title,
  description,
  status,
  priority,
  startDate,
  dueDate,
  createdBy
}) {
  const result = await pool.query(
    `
    INSERT INTO goals (
      company_id,
      title,
      description,
      status,
      priority,
      start_date,
      due_date,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      companyId,
      title,
      description,
      status,
      priority,
      startDate,
      dueDate,
      createdBy
    ]
  );

  return result.rows[0];
}

async function getGoals(companyId) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      title,
      description,
      status,
      priority,
      start_date,
      due_date,
      created_by,
      created_at,
      updated_at
    FROM goals
    WHERE company_id = $1
    ORDER BY created_at DESC
    `,
    [companyId]
  );

  return result.rows;
}

async function getGoalById(companyId, goalId) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      title,
      description,
      status,
      priority,
      start_date,
      due_date,
      created_by,
      created_at,
      updated_at
    FROM goals
    WHERE id = $1
      AND company_id = $2
    LIMIT 1
    `,
    [goalId, companyId]
  );

  return result.rows[0];
}

async function updateGoal({
  companyId,
  goalId,
  title,
  description,
  status,
  priority,
  startDate,
  dueDate
}) {
  const result = await pool.query(
    `
    UPDATE goals
    SET
      title = $1,
      description = $2,
      status = $3,
      priority = $4,
      start_date = $5,
      due_date = $6,
      updated_at = NOW()
    WHERE id = $7
      AND company_id = $8
    RETURNING *
    `,
    [
      title,
      description,
      status,
      priority,
      startDate,
      dueDate,
      goalId,
      companyId
    ]
  );

  return result.rows[0];
}

async function deleteGoal(companyId, goalId) {
  const result = await pool.query(
    `
    DELETE FROM goals
    WHERE id = $1
      AND company_id = $2
    RETURNING id
    `,
    [goalId, companyId]
  );

  return result.rows[0];
}

module.exports = {
  createGoal,
  getGoals,
  getGoalById,
  updateGoal,
  deleteGoal
};