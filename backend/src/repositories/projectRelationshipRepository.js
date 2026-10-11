const pool = require("../db/database");

async function addProjectLead(projectId, userId) {
  const result = await pool.query(
    `
    INSERT INTO project_leads (
      project_id,
      user_id
    )
    VALUES ($1, $2)
    RETURNING *
    `,
    [projectId, userId]
  );

  return result.rows[0];
}

async function addProjectMember(projectId, userId) {
  const result = await pool.query(
    `
    INSERT INTO project_members (
      project_id,
      user_id
    )
    VALUES ($1, $2)
    RETURNING *
    `,
    [projectId, userId]
  );

  return result.rows[0];
}

async function addProjectOrganizationUnit(
  projectId,
  organizationUnitId
) {
  const result = await pool.query(
    `
    INSERT INTO project_organization_units (
      project_id,
      organization_unit_id
    )
    VALUES ($1, $2)
    RETURNING *
    `,
    [projectId, organizationUnitId]
  );

  return result.rows[0];
}

async function getProjectLeads(projectId) {
  const result = await pool.query(
    `
    SELECT user_id
    FROM project_leads
    WHERE project_id = $1
    `,
    [projectId]
  );

  return result.rows;
}

module.exports = {
  addProjectLead,
  addProjectMember,
  addProjectOrganizationUnit,
  getProjectLeads
};