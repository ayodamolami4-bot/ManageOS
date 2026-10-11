const {
  addProjectRelationshipWithAudit,
  removeProjectRelationshipWithAudit
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

  // Only users with a manager or scoped team-lead role may lead a project.
  // A scoped role needs a matching organization unit linked to the project.
  const eligible = await pool.query(
    `SELECT 1 FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = $1
       AND r.company_id IS NULL AND r.is_system = TRUE
       AND (
         (r.name = 'MANAGER' AND (
           ur.organization_unit_id IS NULL
           OR EXISTS (SELECT 1 FROM project_organization_units pou
                      WHERE pou.project_id = $2
                        AND pou.organization_unit_id = ur.organization_unit_id)
         ))
         OR (r.name = 'TEAM_LEAD' AND ur.organization_unit_id IS NOT NULL
             AND EXISTS (SELECT 1 FROM project_organization_units pou
                         WHERE pou.project_id = $2
                           AND pou.organization_unit_id = ur.organization_unit_id))
       )
     LIMIT 1`,
    [userId, projectId]
  );
  if (!eligible.rows.length) throw new Error("USER_NOT_ELIGIBLE_TO_LEAD");
  return addProjectRelationshipWithAudit({
    projectId, relatedId: userId, type: "LEAD",
    companyId: currentUser.company_id, actorId: currentUser.id,
  });
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

  return addProjectRelationshipWithAudit({
    projectId, relatedId: userId, type: "MEMBER",
    companyId: currentUser.company_id, actorId: currentUser.id,
  });
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

  return addProjectRelationshipWithAudit({
    projectId, relatedId: organizationUnitId, type: "UNIT",
    companyId: currentUser.company_id, actorId: currentUser.id,
  });
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

async function getProjectLeadsForCompany(projectId, currentUser) {
  await verifyProjectBelongsToCompany(projectId, currentUser.company_id);
  const result = await pool.query(
    `SELECT u.id, u.first_name, u.last_name, u.email
     FROM project_leads pl
     JOIN projects p ON p.id = pl.project_id
     JOIN users u ON u.id = pl.user_id
     WHERE pl.project_id = $1 AND p.company_id = $2 AND u.company_id = $2
     ORDER BY u.first_name, u.last_name`,
    [projectId, currentUser.company_id]
  );
  return result.rows;
}

async function getProjectUnitsForCompany(projectId, currentUser) {
  await verifyProjectBelongsToCompany(projectId, currentUser.company_id);
  const result = await pool.query(
    `SELECT ou.id, ou.name, ou.type
     FROM project_organization_units pou
     JOIN projects p ON p.id = pou.project_id
     JOIN organization_units ou ON ou.id = pou.organization_unit_id
     WHERE pou.project_id = $1 AND p.company_id = $2 AND ou.company_id = $2
     ORDER BY ou.name`,
    [projectId, currentUser.company_id]
  );
  return result.rows;
}


async function removeProjectMember(projectId, userId, currentUser) {
  return removeProjectRelationshipWithAudit({
    projectId, userId, type: "MEMBER",
    companyId: currentUser.company_id, actorId: currentUser.id,
  });
}

async function removeProjectLead(projectId, userId, currentUser) {
  return removeProjectRelationshipWithAudit({
    projectId, userId, type: "LEAD",
    companyId: currentUser.company_id, actorId: currentUser.id,
  });
}

module.exports = {
  assignProjectLead,
  addProjectMemberToProject,
  linkProjectOrganizationUnit,
  getProjectMembers,
  getProjectLeadsForCompany,
  getProjectUnitsForCompany,
  removeProjectMember,
  removeProjectLead
};