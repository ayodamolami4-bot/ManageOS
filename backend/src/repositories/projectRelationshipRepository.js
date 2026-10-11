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

const {
  createActivityWithClient,
} = require("./activityRepository");
const { createAuditLogWithClient } = require("./auditLogRepository");

const RELATIONS = Object.freeze({
  LEAD: { table: "project_leads", column: "user_id", action: "PROJECT_LEAD_ASSIGNED" },
  MEMBER: { table: "project_members", column: "user_id", action: "PROJECT_MEMBER_ADDED" },
  UNIT: { table: "project_organization_units", column: "organization_unit_id", action: "PROJECT_UNIT_LINKED" },
});

async function addProjectRelationshipWithAudit({
  projectId, companyId, actorId, relatedId, type,
}) {
  const spec = RELATIONS[type];
  if (!spec) throw new Error("INVALID_PROJECT_RELATIONSHIP");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const owned = await client.query(
      "SELECT id FROM projects WHERE id = $1 AND company_id = $2 FOR UPDATE",
      [projectId, companyId]
    );
    if (!owned.rows.length) throw new Error("PROJECT_NOT_FOUND");

    const result = await client.query(
      `INSERT INTO ${spec.table} (project_id, ${spec.column})
       VALUES ($1, $2) RETURNING *`,
      [projectId, relatedId]
    );
    const relationship = result.rows[0];

    await createActivityWithClient(client, {
      companyId, actorId, action: spec.action,
      resourceType: "PROJECT", resourceId: projectId,
      metadata: { related_id: relatedId, relationship_id: relationship.id, type },
    });
    await createAuditLogWithClient(client, {
      companyId, actorId, action: spec.action,
      resourceType: "PROJECT", resourceId: projectId,
      newValues: { related_id: relatedId, relationship_id: relationship.id, type },
    });

    await client.query("COMMIT");
    return relationship;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  addProjectLead,
  addProjectMember,
  addProjectOrganizationUnit,
  getProjectLeads,
  addProjectRelationshipWithAudit
};