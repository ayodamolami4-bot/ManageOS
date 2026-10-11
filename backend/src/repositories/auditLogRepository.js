const pool = require("../db/database");

async function createAuditLog({
  companyId,
  actorId = null,
  action,
  resourceType,
  resourceId,
  oldValues = null,
  newValues = null,
  metadata = {}
}) {
  const result = await pool.query(
    `
    INSERT INTO audit_logs (
      company_id,
      actor_id,
      action,
      resource_type,
      resource_id,
      old_values,
      new_values,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      companyId,
      actorId,
      action,
      resourceType,
      resourceId,
      oldValues,
      newValues,
      metadata
    ]
  );

  return result.rows[0];
}

async function createAuditLogWithClient(
  client,
  {
    companyId,
    actorId = null,
    action,
    resourceType,
    resourceId,
    oldValues = null,
    newValues = null,
    metadata = {}
  }
) {
  const result = await client.query(
    `
    INSERT INTO audit_logs (
      company_id,
      actor_id,
      action,
      resource_type,
      resource_id,
      old_values,
      new_values,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
    `,
    [
      companyId,
      actorId,
      action,
      resourceType,
      resourceId,
      oldValues,
      newValues,
      metadata
    ]
  );

  return result.rows[0];
}

async function getCompanyAuditLogs(companyId) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      actor_id,
      action,
      resource_type,
      resource_id,
      old_values,
      new_values,
      metadata,
      created_at
    FROM audit_logs
    WHERE company_id = $1
    ORDER BY created_at DESC
    `,
    [companyId]
  );

  return result.rows;
}

async function getAuditLogById(auditLogId, companyId) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      actor_id,
      action,
      resource_type,
      resource_id,
      old_values,
      new_values,
      metadata,
      created_at
    FROM audit_logs
    WHERE id = $1
      AND company_id = $2
    LIMIT 1
    `,
    [auditLogId, companyId]
  );

  return result.rows[0];
}

module.exports = {
  createAuditLog,
  createAuditLogWithClient,
  getCompanyAuditLogs,
  getAuditLogById
};