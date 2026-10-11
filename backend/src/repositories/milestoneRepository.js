const pool = require("../db/database");

async function createMilestone({
  projectId,
  name,
  description,
  status,
  dueDate,
  createdBy
}) {
  const result = await pool.query(
    `
    INSERT INTO milestones (
      project_id,
      name,
      description,
      status,
      due_date,
      created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      projectId,
      name,
      description,
      status,
      dueDate,
      createdBy
    ]
  );

  return result.rows[0];
}

async function getMilestones(projectId) {
  const result = await pool.query(
    `
    SELECT
      id,
      project_id,
      name,
      description,
      status,
      due_date,
      created_by,
      created_at,
      updated_at
    FROM milestones
    WHERE project_id = $1
    ORDER BY created_at DESC
    `,
    [projectId]
  );

  return result.rows;
}

async function getMilestoneById(projectId, milestoneId) {
  const result = await pool.query(
    `
    SELECT
      id,
      project_id,
      name,
      description,
      status,
      due_date,
      created_by,
      created_at,
      updated_at
    FROM milestones
    WHERE id = $1
      AND project_id = $2
    LIMIT 1
    `,
    [milestoneId, projectId]
  );

  return result.rows[0];
}

async function updateMilestone({
  projectId,
  milestoneId,
  name,
  description,
  status,
  dueDate
}) {
  const result = await pool.query(
    `
    UPDATE milestones
    SET
      name = $1,
      description = $2,
      status = $3,
      due_date = $4,
      updated_at = NOW()
    WHERE id = $5
      AND project_id = $6
    RETURNING *
    `,
    [
      name,
      description,
      status,
      dueDate,
      milestoneId,
      projectId
    ]
  );

  return result.rows[0];
}

async function deleteMilestone(projectId, milestoneId) {
  const result = await pool.query(
    `
    DELETE FROM milestones
    WHERE id = $1
      AND project_id = $2
    RETURNING id
    `,
    [milestoneId, projectId]
  );

  return result.rows[0];
}

module.exports = {
  createMilestone,
  getMilestones,
  getMilestoneById,
  updateMilestone,
  deleteMilestone
};