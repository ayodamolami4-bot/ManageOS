const {
  addProjectLead,
  addProjectMember,
  addProjectOrganizationUnit
} = require("../repositories/projectRelationshipRepository");

const pool = require("../db/database");

async function verifyProjectBelongsToCompany(projectId, companyId) {
  const result = await pool.query(
    `
    SELECT id
    FROM projects
    WHERE id = $1
      AND company_id = $2
    LIMIT 1
    `,
    [projectId, companyId]
  );

  if (!result.rows[0]) {
    throw new Error("PROJECT_NOT_FOUND");
  }
}

async function verifyUserBelongsToCompany(userId, companyId) {
  const result = await pool.query(
    `
    SELECT id
    FROM users
    WHERE id = $1
      AND company_id = $2
    LIMIT 1
    `,
    [userId, companyId]
  );

  if (!result.rows[0]) {
    throw new Error("USER_NOT_FOUND");
  }
}

async function verifyOrganizationUnitBelongsToCompany(
  organizationUnitId,
  companyId
) {
  const result = await pool.query(
    `
    SELECT id
    FROM organization_units
    WHERE id = $1
      AND company_id = $2
    LIMIT 1
    `,
    [organizationUnitId, companyId]
  );

  if (!result.rows[0]) {
    throw new Error("ORGANIZATION_UNIT_NOT_FOUND");
  }
}

async function assignProjectLead(
  projectId,
  userId,
  currentUser
) {
  await verifyProjectBelongsToCompany(
    projectId,
    currentUser.company_id
  );

  await verifyUserBelongsToCompany(
    userId,
    currentUser.company_id
  );

  return await addProjectLead(projectId, userId);
}

async function addProjectMemberToProject(
  projectId,
  userId,
  currentUser
) {
  await verifyProjectBelongsToCompany(
    projectId,
    currentUser.company_id
  );

  await verifyUserBelongsToCompany(
    userId,
    currentUser.company_id
  );

  return await addProjectMember(projectId, userId);
}

async function linkProjectOrganizationUnit(
  projectId,
  organizationUnitId,
  currentUser
) {
  await verifyProjectBelongsToCompany(
    projectId,
    currentUser.company_id
  );

  await verifyOrganizationUnitBelongsToCompany(
    organizationUnitId,
    currentUser.company_id
  );

  return await addProjectOrganizationUnit(
    projectId,
    organizationUnitId
  );
}

async function getProjectMembers(projectId, currentUser) {
  await verifyProjectBelongsToCompany(projectId, currentUser.company_id);
  const result = await pool.query(
    `SELECT u.id, u.first_name, u.last_name, u.email
     FROM project_members pm
     JOIN projects p ON p.id = pm.project_id
     JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1 AND p.company_id = $2 AND u.company_id = $2
     ORDER BY u.first_name, u.last_name`,
    [projectId, currentUser.company_id]
  );
  return result.rows;
}

module.exports = {
  assignProjectLead,
  addProjectMemberToProject,
  linkProjectOrganizationUnit,
  getProjectMembers
};