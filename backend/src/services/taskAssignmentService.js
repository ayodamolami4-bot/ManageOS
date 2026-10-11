const pool = require("../db/database");
const {
  getTaskAssignments,
  assignTaskAtomically,
  endTaskAssignmentAtomically,
} = require("../repositories/taskAssignmentRepository");
const {
  canManageTask,
  canViewTask,
} = require("./authorizationService");

async function findTask(taskId, companyId) {
  const result = await pool.query(
    "SELECT id, project_id FROM tasks WHERE id = $1 AND company_id = $2",
    [taskId, companyId]
  );
  if (!result.rows[0]) throw new Error("TASK_NOT_FOUND");
  return result.rows[0];
}

async function assignTask({ taskId, userId, estimatedEffortHours }, actor) {
  await findTask(taskId, actor.company_id);
  if (!(await canManageTask(actor, taskId))) throw new Error("FORBIDDEN");

  const user = await pool.query(
    "SELECT id FROM users WHERE id = $1 AND company_id = $2",
    [userId, actor.company_id]
  );
  if (!user.rows[0]) throw new Error("USER_NOT_FOUND");

  return assignTaskAtomically({
    taskId, companyId: actor.company_id, userId,
    assignedBy: actor.id, estimatedEffortHours,
  });
}

async function getTaskAssignmentHistory(taskId, actor) {
  await findTask(taskId, actor.company_id);
  if (!(await canViewTask(actor, taskId))) throw new Error("FORBIDDEN");
  return getTaskAssignments(taskId);
}

async function endAssignment(assignmentId, actor) {
  const match = await pool.query(
    `SELECT ta.task_id FROM task_assignments ta
     JOIN tasks t ON t.id = ta.task_id
     WHERE ta.id = $1 AND ta.ended_at IS NULL AND t.company_id = $2`,
    [assignmentId, actor.company_id]
  );
  const taskId = match.rows[0]?.task_id;
  if (!taskId) throw new Error("ASSIGNMENT_NOT_FOUND");
  if (!(await canManageTask(actor, taskId))) throw new Error("FORBIDDEN");

  return endTaskAssignmentAtomically({
    assignmentId, taskId, companyId: actor.company_id, endedBy: actor.id,
  });
}

module.exports = {
  assignTask,
  getTaskAssignmentHistory,
  endAssignment,
};
