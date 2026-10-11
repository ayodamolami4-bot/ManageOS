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

module.exports = {
  assignProjectLead,
  addProjectMemberToProject,
  linkProjectOrganizationUnit
};