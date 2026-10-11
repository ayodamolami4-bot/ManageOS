const pool = require("../db/database");

async function createOrganizationUnit({
  companyId,
  parentUnitId,
  name,
  type,
  description
}) {
  const result = await pool.query(
    `
    INSERT INTO organization_units (
      company_id,
      parent_unit_id,
      name,
      type,
      description
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [companyId, parentUnitId, name, type, description]
  );

  return result.rows[0];
}
async function getOrganizationUnits(companyId) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      parent_unit_id,
      name,
      type,
      description,
      created_at,
      updated_at
    FROM organization_units
    WHERE company_id = $1
    ORDER BY name ASC
    `,
    [companyId]
  );

  return result.rows;
}

async function getOrganizationUnitById(id, companyId) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      parent_unit_id,
      name,
      type,
      description,
      created_at,
      updated_at
    FROM organization_units
    WHERE id = $1
      AND company_id = $2
    LIMIT 1
    `,
    [id, companyId]
  );

  return result.rows[0];
}
module.exports = {
  createOrganizationUnit,
  getOrganizationUnits,
  getOrganizationUnitById
};