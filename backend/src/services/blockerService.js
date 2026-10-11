const pool = require("../db/database");
const {
  canViewTask,
  canManageTask,
  canSubmitTask,
} = require("./authorizationService");
const {
  createBlocker,
  getTaskBlockers,
  getBlockerById,
  resolveBlocker,
} = require("../repositories/blockerRepository");

async function requireTask(taskId, user) {
  const result = await pool.query(
    "SELECT id FROM tasks WHERE id = $1 AND company_id = $2 LIMIT 1",
    [taskId, user.company_id]
  );
  if (!result.rows[0]) throw new Error("TASK_NOT_FOUND");
  return result.rows[0];
}

async function requireTaskView(taskId, user) {
  await requireTask(taskId, user);
  if (!(await canViewTask(user, taskId))) throw new Error("FORBIDDEN");
}

async function createTaskBlocker({ taskId, title, description }, user) {
  await requireTask(taskId, user);
  const allowed = (await canSubmitTask(user, taskId)) ||
    (await canManageTask(user, taskId));
  if (!allowed) throw new Error("FORBIDDEN");

  return createBlocker({
    taskId, reportedBy: user.id,
    title: title.trim(), description: description ?? null,
  });
}

async function getBlockersForTask(taskId, user) {
  await requireTaskView(taskId, user);
  return getTaskBlockers(taskId);
}

async function getBlocker(blockerId, user) {
  const blocker = await getBlockerById(blockerId);
  if (!blocker) throw new Error("BLOCKER_NOT_FOUND");
  try {
    await requireTaskView(blocker.task_id, user);
  } catch (error) {
    if (error.message === "TASK_NOT_FOUND") throw new Error("BLOCKER_NOT_FOUND");
    throw error;
  }
  return blocker;
}

async function resolveTaskBlocker(blockerId, user) {
  const blocker = await getBlocker(blockerId, user);
  const allowed = (await canManageTask(user, blocker.task_id)) ||
    blocker.reported_by === user.id;
  if (!allowed) throw new Error("FORBIDDEN");
  if (blocker.status !== "OPEN") throw new Error("BLOCKER_ALREADY_RESOLVED");

  const result = await resolveBlocker(blockerId, user.id);
  // Concurrent resolution attempts must not appear successful.
  if (!result) throw new Error("BLOCKER_ALREADY_RESOLVED");
  return result;
}

module.exports = {
  createTaskBlocker,
  getBlockersForTask,
  getBlocker,
  resolveTaskBlocker,
};
