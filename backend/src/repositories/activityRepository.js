const pool = require("../db/database");

async function createActivity({
  companyId,
  actorId,
  action,
  resourceType,
  resourceId,
  metadata = {}
}) {
  const result = await pool.query(
    `
    INSERT INTO activities (
      company_id,
      actor_id,
      action,
      resource_type,
      resource_id,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      companyId,
      actorId,
      action,
      resourceType,
      resourceId,
      metadata
    ]
  );

  return result.rows[0];
}

async function createActivityWithClient(
  client,
  {
    companyId,
    actorId,
    action,
    resourceType,
    resourceId,
    metadata = {}
  }
) {
  const result = await client.query(
    `
    INSERT INTO activities (
      company_id,
      actor_id,
      action,
      resource_type,
      resource_id,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
    `,
    [
      companyId,
      actorId,
      action,
      resourceType,
      resourceId,
      metadata
    ]
  );

  return result.rows[0];
}

async function getCompanyActivities({
  companyId,
  actorId,
  action,
  resourceType,
  resourceId,
  from,
  to,
  limit,
  offset
}) {
  const conditions = ["company_id = $1"];
  const values = [companyId];

  let parameterIndex = 2;

  if (actorId) {
    conditions.push(`actor_id = $${parameterIndex}`);
    values.push(actorId);
    parameterIndex++;
  }

  if (action) {
    conditions.push(`action = $${parameterIndex}`);
    values.push(action);
    parameterIndex++;
  }

  if (resourceType) {
    conditions.push(`resource_type = $${parameterIndex}`);
    values.push(resourceType);
    parameterIndex++;
  }

  if (resourceId) {
    conditions.push(`resource_id = $${parameterIndex}`);
    values.push(resourceId);
    parameterIndex++;
  }

  if (from) {
    conditions.push(`created_at >= $${parameterIndex}`);
    values.push(from);
    parameterIndex++;
  }

  if (to) {
    conditions.push(`created_at <= $${parameterIndex}`);
    values.push(to);
    parameterIndex++;
  }

  const whereClause = conditions.join(" AND ");

  const countResult = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM activities
    WHERE ${whereClause}
    `,
    values
  );

  const total = countResult.rows[0].total;

  const activityValues = [
    ...values,
    limit,
    offset
  ];

  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      actor_id,
      action,
      resource_type,
      resource_id,
      metadata,
      created_at
    FROM activities
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${parameterIndex}
    OFFSET $${parameterIndex + 1}
    `,
    activityValues
  );

  return {
    activities: result.rows,
    total
  };
}

async function getActivityById(
  companyId,
  activityId
) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      actor_id,
      action,
      resource_type,
      resource_id,
      metadata,
      created_at
    FROM activities
    WHERE id = $1
      AND company_id = $2
    LIMIT 1
    `,
    [activityId, companyId]
  );

  return result.rows[0];
}

module.exports = {
  createActivity,
  createActivityWithClient,
  getCompanyActivities,
  getActivityById
};