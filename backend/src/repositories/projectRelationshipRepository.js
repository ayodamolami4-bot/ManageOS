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


/**
 * Removing a project relationship must not orphan active work or silently
 * remove the final Manager from project leadership.
 * The project row is our serialization point for concurrent assignment
 * and membership/lead edits.
 */
async function removeProjectRelationshipWithAudit({
  projectId, companyId, actorId, userId, type,
}) {
  if (!["MEMBER", "LEAD"].includes(type)) {
    throw new Error("INVALID_PROJECT_RELATIONSHIP");
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const project = await client.query(
      "SELECT id FROM projects WHERE id = $1 AND company_id = $2 FOR UPDATE",
      [projectId, companyId]
    );
    if (!project.rows.length) throw new Error("PROJECT_NOT_FOUND");

    const table = type === "MEMBER" ? "project_members" : "project_leads";
    const result = await client.query(
      `SELECT id, project_id, user_id FROM ${table}
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    const existing = result.rows[0];
    if (!existing) throw new Error("PROJECT_RELATIONSHIP_NOT_FOUND");

    if (type === "MEMBER") {
      const activeAssignments = await client.query(
        `SELECT 1 FROM task_assignments ta
         JOIN tasks t ON t.id = ta.task_id
         WHERE t.project_id = $1 AND t.company_id = $3
           AND ta.user_id = $2 AND ta.ended_at IS NULL
         LIMIT 1`,
        [projectId, userId, companyId]
      );
      if (activeAssignments.rows.length) {
        throw new Error("PROJECT_MEMBER_HAS_ACTIVE_TASKS");
      }
      const stillLead = await client.query(
        "SELECT 1 FROM project_leads WHERE project_id = $1 AND user_id = $2 LIMIT 1",
        [projectId, userId]
      );
      if (stillLead.rows.length) {
        throw new Error("REMOVE_PROJECT_LEAD_FIRST");
      }
    } else {
      // Project work must remain accountable to at least one Manager.
      const remainingManagers = await client.query(
        `SELECT 1
         FROM project_leads pl
         JOIN user_roles ur ON ur.user_id = pl.user_id
         JOIN roles r ON r.id = ur.role_id
         JOIN users u ON u.id = pl.user_id
         WHERE pl.project_id = $1 AND pl.user_id <> $2
           AND u.company_id = $3
           AND r.name = 'MANAGER' AND r.is_system = TRUE
           AND r.company_id IS NULL
           AND (ur.organization_unit_id IS NULL OR EXISTS (
             SELECT 1 FROM project_organization_units pou
             WHERE pou.project_id = $1
               AND pou.organization_unit_id = ur.organization_unit_id
           ))
         LIMIT 1`,
        [projectId, userId, companyId]
      );
      if (!remainingManagers.rows.length) {
        throw new Error("LAST_PROJECT_MANAGER");
      }
    }

    const deleted = await client.query(
      `DELETE FROM ${table} WHERE id = $1 RETURNING *`, [existing.id]
    );
    const action = type === "MEMBER" ? "PROJECT_MEMBER_REMOVED" : "PROJECT_LEAD_REMOVED";
    await createActivityWithClient(client, {
      companyId, actorId, action, resourceType: "PROJECT", resourceId: projectId,
      metadata: { user_id: userId, relationship_id: existing.id },
    });
    await createAuditLogWithClient(client, {
      companyId, actorId, action, resourceType: "PROJECT", resourceId: projectId,
      oldValues: { user_id: userId, relationship_id: existing.id, type },
    });
    await client.query("COMMIT");
    return deleted.rows[0];
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
  addProjectRelationshipWithAudit,
  removeProjectRelationshipWithAudit
};