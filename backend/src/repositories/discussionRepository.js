const pool = require("../db/database");

async function createDiscussion({
  companyId,
  createdBy,
  resourceType,
  resourceId,
  title
}) {
  const result = await pool.query(
    `
    INSERT INTO discussions (
      company_id,
      created_by,
      resource_type,
      resource_id,
      title
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [
      companyId,
      createdBy,
      resourceType,
      resourceId,
      title
    ]
  );

  return result.rows[0];
}

async function getCompanyDiscussions(companyId) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      created_by,
      resource_type,
      resource_id,
      title,
      created_at,
      updated_at
    FROM discussions
    WHERE company_id = $1
    ORDER BY created_at DESC
    `,
    [companyId]
  );

  return result.rows;
}

async function getDiscussionById(discussionId) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      created_by,
      resource_type,
      resource_id,
      title,
      created_at,
      updated_at
    FROM discussions
    WHERE id = $1
    LIMIT 1
    `,
    [discussionId]
  );

  return result.rows[0];
}

async function getResourceDiscussions(
  companyId,
  resourceType,
  resourceId
) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      created_by,
      resource_type,
      resource_id,
      title,
      created_at,
      updated_at
    FROM discussions
    WHERE company_id = $1
      AND resource_type = $2
      AND resource_id = $3
    ORDER BY created_at DESC
    `,
    [
      companyId,
      resourceType,
      resourceId
    ]
  );

  return result.rows;
}

module.exports = {
  createDiscussion,
  getCompanyDiscussions,
  getDiscussionById,
  getResourceDiscussions
};