const {
  createBlocker,
  getTaskBlockers,
  getBlockerById,
  resolveBlocker
} = require("../repositories/blockerRepository");

const pool = require("../db/database");

async function getTaskForCompany(taskId, companyId) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id
    FROM tasks
    WHERE id = $1
      AND company_id = $2
    LIMIT 1
    `,
    [taskId, companyId]
  );

  return result.rows[0];
}

async function createTaskBlocker({
  taskId,
  title,
  description
}, user) {
  const task = await getTaskForCompany(
    taskId,
    user.company_id
  );

  if (!task) {
    throw new Error("TASK_NOT_FOUND");
  }

  if (!title || !title.trim()) {
    throw new Error("BLOCKER_TITLE_REQUIRED");
  }

  return await createBlocker({
    taskId,
    reportedBy: user.id,
    title: title.trim(),
    description
  });
}

async function getBlockersForTask(taskId, user) {
  const task = await getTaskForCompany(
    taskId,
    user.company_id
  );

  if (!task) {
    throw new Error("TASK_NOT_FOUND");
  }

  return await getTaskBlockers(taskId);
}

async function getBlocker(blockerId, user) {
  const blocker = await getBlockerById(blockerId);

  if (!blocker) {
    throw new Error("BLOCKER_NOT_FOUND");
  }

  const task = await getTaskForCompany(
    blocker.task_id,
    user.company_id
  );

  if (!task) {
    throw new Error("BLOCKER_NOT_FOUND");
  }

  return blocker;
}

async function resolveTaskBlocker(blockerId, user) {
  const blocker = await getBlocker(blockerId, user);

  if (blocker.status === "RESOLVED") {
    throw new Error("BLOCKER_ALREADY_RESOLVED");
  }

  return await resolveBlocker(
    blockerId,
    user.id
  );
}

module.exports = {
  createTaskBlocker,
  getBlockersForTask,
  getBlocker,
  resolveTaskBlocker
};