const pool = require("../db/database");
const { createActivityWithClient } = require("./activityRepository");
const { createAuditLogWithClient } = require("./auditLogRepository");

async function getGoalProjects(goalId, companyId) {
  const result = await pool.query(
    `SELECT p.id, p.name, p.status, p.priority, p.due_date, l.linked_at
     FROM goal_project_links l
     JOIN goals g ON g.id = l.goal_id
     JOIN projects p ON p.id = l.project_id
     WHERE g.id = $1 AND g.company_id = $2 AND p.company_id = $2
     ORDER BY p.name, p.id`,
    [goalId, companyId]
  );
  return result.rows;
}

async function getProjectGoals(projectId, companyId) {
  const result = await pool.query(
    `SELECT g.id, g.title, g.status, g.priority, g.due_date, l.linked_at
     FROM goal_project_links l
     JOIN goals g ON g.id = l.goal_id
     JOIN projects p ON p.id = l.project_id
     WHERE p.id = $1 AND p.company_id = $2 AND g.company_id = $2
     ORDER BY g.title, g.id`,
    [projectId, companyId]
  );
  return result.rows;
}

async function changeGoalProjectLink({ goalId, projectId, user, action }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const goal = await client.query(
      "SELECT id FROM goals WHERE id = $1 AND company_id = $2 FOR UPDATE",
      [goalId, user.company_id]
    );
    if (!goal.rows.length) throw new Error("GOAL_NOT_FOUND");

    const project = await client.query(
      "SELECT id FROM projects WHERE id = $1 AND company_id = $2 FOR SHARE",
      [projectId, user.company_id]
    );
    if (!project.rows.length) throw new Error("PROJECT_NOT_FOUND");

    const sql = action === "LINK"
      ? `INSERT INTO goal_project_links (goal_id, project_id, linked_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (goal_id, project_id) DO NOTHING RETURNING *`
      : `DELETE FROM goal_project_links WHERE goal_id = $1 AND project_id = $2 RETURNING *`;
    const params = action === "LINK" ? [goalId, projectId, user.id] : [goalId, projectId];
    const changed = await client.query(sql, params);
    if (!changed.rows.length) {
      throw new Error(action === "LINK" ? "GOAL_PROJECT_ALREADY_LINKED" : "GOAL_PROJECT_NOT_LINKED");
    }

    const actionName = action === "LINK" ? "GOAL_PROJECT_LINKED" : "GOAL_PROJECT_UNLINKED";
    await createActivityWithClient(client, {
      companyId: user.company_id, actorId: user.id,
      action: actionName, resourceType: "GOAL", resourceId: goalId,
      metadata: { project_id: projectId },
    });
    await createAuditLogWithClient(client, {
      companyId: user.company_id, actorId: user.id,
      action: actionName, resourceType: "GOAL", resourceId: goalId,
      oldValues: action === "UNLINK" ? { project_id: projectId } : null,
      newValues: action === "LINK" ? { project_id: projectId } : null,
    });

    await client.query("COMMIT");
    return changed.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
module.exports = { getGoalProjects, getProjectGoals, changeGoalProjectLink };
