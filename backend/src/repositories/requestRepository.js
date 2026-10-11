const pool = require("../db/database");

async function createRequest({
  companyId,
  requestedBy,
  assignedTo,
  type,
  title,
  description
}) {
  const result = await pool.query(
    `
    INSERT INTO requests (
      company_id,
      requested_by,
      assigned_to,
      type,
      title,
      description
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      companyId,
      requestedBy,
      assignedTo,
      type,
      title,
      description
    ]
  );

  return result.rows[0];
}

async function getCompanyRequests(companyId) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      requested_by,
      assigned_to,
      type,
      title,
      description,
      status,
      created_at,
      updated_at
    FROM requests
    WHERE company_id = $1
    ORDER BY created_at DESC
    `,
    [companyId]
  );

  return result.rows;
}

async function getRequestById(requestId) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      requested_by,
      assigned_to,
      type,
      title,
      description,
      status,
      created_at,
      updated_at
    FROM requests
    WHERE id = $1
    LIMIT 1
    `,
    [requestId]
  );

  return result.rows[0];
}

async function updateRequestStatus(
  requestId,
  status
) {
  const result = await pool.query(
    `
    UPDATE requests
    SET
      status = $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    [status, requestId]
  );

  return result.rows[0];
}

module.exports = {
  createRequest,
  getCompanyRequests,
  getRequestById,
  updateRequestStatus
};