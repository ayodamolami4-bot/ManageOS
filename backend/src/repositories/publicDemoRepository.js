const pool = require("../db/database");
const { DEMO_ID, DEMO_NAME, APPROVED_FILES } = require("../config/publicDemo");

async function exists() {
  const result = await pool.query("SELECT 1 FROM companies WHERE id=$1 AND name=$2", [DEMO_ID, DEMO_NAME]);
  return result.rowCount === 1;
}

async function getOverviewData() {
    const statements = [
      ["goals", `SELECT id,title,description,status,priority,due_date
          FROM goals WHERE company_id=$1 ORDER BY created_at DESC LIMIT 40`],
      ["projects", `SELECT id,name,description,status,priority,start_date,due_date
          FROM projects WHERE company_id=$1 ORDER BY created_at DESC LIMIT 40`],
      ["goalLinks", `SELECT l.goal_id,l.project_id FROM goal_project_links l
          JOIN goals g ON g.id=l.goal_id JOIN projects p ON p.id=l.project_id
          WHERE g.company_id=$1 AND p.company_id=$1 LIMIT 100`],
      ["milestones", `SELECT m.id,m.project_id,m.name,m.description,m.status,m.due_date
          FROM milestones m JOIN projects p ON p.id=m.project_id
          WHERE p.company_id=$1 ORDER BY m.due_date NULLS LAST LIMIT 120`],
      ["units", `SELECT id,name,type,description,parent_unit_id FROM organization_units
          WHERE company_id=$1 ORDER BY name LIMIT 50`],
      ["people", `SELECT u.id,u.first_name,u.last_name,u.job_title,
          r.name AS role_name,ou.name AS unit_name
          FROM users u JOIN user_roles ur ON ur.user_id=u.id
          JOIN roles r ON r.id=ur.role_id
          LEFT JOIN organization_units ou ON ou.id=ur.organization_unit_id AND ou.company_id=u.company_id
          WHERE u.company_id=$1 ORDER BY u.first_name LIMIT 70`],
      ["tasks", `SELECT t.id,t.title,t.description,t.project_id,t.milestone_id,
          t.status,t.priority,t.due_date,p.name AS project_name,
          u.first_name AS assignee_first_name,u.last_name AS assignee_last_name
          FROM tasks t JOIN projects p ON p.id=t.project_id AND p.company_id=$1
          LEFT JOIN task_assignments ta ON ta.task_id=t.id AND ta.ended_at IS NULL
          LEFT JOIN users u ON u.id=ta.user_id AND u.company_id=$1
          WHERE t.company_id=$1 ORDER BY t.created_at DESC LIMIT 120`],
      ["taskHistory", `SELECT h.task_id,h.previous_status,h.new_status,h.created_at,
          u.first_name AS actor_first_name,u.last_name AS actor_last_name
          FROM task_status_history h JOIN tasks t ON t.id=h.task_id AND t.company_id=$1
          JOIN users u ON u.id=h.changed_by AND u.company_id=$1
          ORDER BY h.created_at ASC LIMIT 300`],
      ["reports", `SELECT r.task_id,r.progress_percentage,r.content,r.created_at
          FROM reports r JOIN tasks t ON t.id=r.task_id AND t.company_id=$1
          ORDER BY r.created_at DESC LIMIT 120`],
      ["reviews", `SELECT s.task_id,r.decision,r.comment,r.reviewed_at,
          u.first_name AS reviewer_first_name
          FROM task_reviews r JOIN task_submissions s ON s.id=r.submission_id
          JOIN tasks t ON t.id=s.task_id AND t.company_id=$1
          JOIN users u ON u.id=r.reviewed_by AND u.company_id=$1
          ORDER BY r.reviewed_at DESC LIMIT 120`],
      ["blockers", `SELECT b.task_id,b.title,b.description,b.status
          FROM blockers b JOIN tasks t ON t.id=b.task_id AND t.company_id=$1
          ORDER BY b.created_at DESC LIMIT 80`],
      ["requests", `SELECT r.id,r.title,r.description,r.type,r.status,r.created_at,
          u.first_name AS requested_by_first_name
          FROM requests r JOIN users u ON u.id=r.requested_by AND u.company_id=$1
          WHERE r.company_id=$1 ORDER BY r.created_at DESC LIMIT 60`],
      ["discussions", `SELECT d.id,d.resource_id AS project_id,d.title,d.created_at,
          p.name AS project_name
          FROM discussions d JOIN projects p ON p.id=d.resource_id
          AND d.resource_type='PROJECT' AND p.company_id=$1
          WHERE d.company_id=$1 ORDER BY d.created_at DESC LIMIT 60`],
      ["comments", `SELECT c.discussion_id,c.content,c.created_at,
          u.first_name AS author_first_name
          FROM comments c JOIN discussions d ON d.id=c.discussion_id AND d.company_id=$1
          JOIN users u ON u.id=c.author_id AND u.company_id=$1
          ORDER BY c.created_at ASC LIMIT 120`],
      ["activity", `SELECT a.action,a.resource_type,a.created_at,
          u.first_name AS actor_first_name
          FROM activities a JOIN users u ON u.id=a.actor_id AND u.company_id=$1
          WHERE a.company_id=$1 ORDER BY a.created_at DESC LIMIT 70`],
      ["files", `SELECT f.id,f.original_name,f.size_bytes,f.resource_id AS project_id,
          p.name AS project_name FROM files f
          JOIN projects p ON p.id=f.resource_id AND p.company_id=$1
          WHERE f.company_id=$1 AND f.resource_type='PROJECT'
          AND f.mime_type='text/plain' AND f.size_bytes BETWEEN 1 AND 20000
          AND f.original_name=ANY($2::text[])
          AND f.storage_key LIKE ('files/' || $1::text || '/%')
          ORDER BY p.name LIMIT 3`]
    ];
    const entries = await Promise.all(statements.map(async ([key, sql]) => {
      const params = key === "files" ? [DEMO_ID, APPROVED_FILES] : [DEMO_ID];
      const result = await pool.query(sql, params);
      return [key, result.rows];
    }));

    return Object.fromEntries(entries);
}

async function findApprovedDocument(fileId) {
    const result = await pool.query(
      `SELECT f.original_name,f.storage_key,f.mime_type,f.size_bytes,f.checksum_sha256
       FROM files f JOIN projects p ON p.id=f.resource_id AND p.company_id=$1
       WHERE f.id=$2 AND f.company_id=$1 AND f.resource_type='PROJECT'
       AND f.mime_type='text/plain' AND f.size_bytes BETWEEN 1 AND 20000
       AND f.original_name=ANY($3::text[])
       AND f.storage_key LIKE ('files/' || $1::text || '/%') LIMIT 1`,
      [DEMO_ID, fileId, APPROVED_FILES]
    );
    const file = result.rows[0];
    return file && APPROVED_FILES.has(file.original_name) ? file : null;

}

module.exports = { exists, getOverviewData, findApprovedDocument };
