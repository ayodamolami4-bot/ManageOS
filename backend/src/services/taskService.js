const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
} = require("../repositories/taskRepository");

const {
  canCreateTask,
  canViewTask,
  canManageTask
} = require("./authorizationService");

const pool =
  require("../db/database");

async function verifyProjectBelongsToCompany(
  projectId,
  companyId
) {
  const result =
    await pool.query(
      `
      SELECT id
      FROM projects
      WHERE id = $1
        AND company_id = $2
      LIMIT 1
      `,
      [
        projectId,
        companyId
      ]
    );

  if (!result.rows[0]) {
    throw new Error(
      "PROJECT_NOT_FOUND"
    );
  }
}

async function verifyMilestoneBelongsToProject(
  milestoneId,
  projectId
) {
  if (!milestoneId) {
    return;
  }

  const result =
    await pool.query(
      `
      SELECT id
      FROM milestones
      WHERE id = $1
        AND project_id = $2
      LIMIT 1
      `,
      [
        milestoneId,
        projectId
      ]
    );

  if (!result.rows[0]) {
    throw new Error(
      "MILESTONE_NOT_FOUND"
    );
  }
}

async function createNewTask(
  {
    projectId,
    milestoneId,
    title,
    description,
    priority,
    dueDate
  },
  user
) {
  const allowed =
    await canCreateTask(
      user,
      projectId
    );

  if (!allowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  await verifyProjectBelongsToCompany(
    projectId,
    user.company_id
  );

  await verifyMilestoneBelongsToProject(
    milestoneId,
    projectId
  );

  return await createTask({
    companyId:
      user.company_id,

    projectId,

    milestoneId,

    title,

    description,

    /*
     * Every new task starts at
     * the first workflow state.
     */
    status:
      "ASSIGNED",

    priority:
      priority || "MEDIUM",

    dueDate,

    createdBy:
      user.id
  });
}

async function getCompanyTasks(
  user
) {
  const tasks =
    await getTasks(
      user.company_id
    );

  const visibleTasks = [];

  for (
    const task of tasks
  ) {
    const allowed =
      await canViewTask(
        user,
        task.id
      );

    if (allowed) {
      visibleTasks.push(
        task
      );
    }
  }

  return visibleTasks;
}

async function getTask(
  taskId,
  user
) {
  const task =
    await getTaskById(
      user.company_id,
      taskId
    );

  if (!task) {
    throw new Error(
      "TASK_NOT_FOUND"
    );
  }

  const allowed =
    await canViewTask(
      user,
      taskId
    );

  if (!allowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  return task;
}

async function updateExistingTask(
  {
    taskId,
    milestoneId,
    title,
    description,
    priority,
    dueDate
  },
  user
) {
  const existingTask =
    await getTaskById(
      user.company_id,
      taskId
    );

  if (!existingTask) {
    throw new Error(
      "TASK_NOT_FOUND"
    );
  }

  const allowed =
    await canManageTask(
      user,
      taskId
    );

  if (!allowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  await verifyMilestoneBelongsToProject(
    milestoneId,
    existingTask.project_id
  );

  return await updateTask({
    companyId:
      user.company_id,

    taskId,

    milestoneId,

    title,

    description,

    priority,

    dueDate
  });
}

async function deleteExistingTask(
  taskId,
  user
) {
  const existingTask =
    await getTaskById(
      user.company_id,
      taskId
    );

  if (!existingTask) {
    throw new Error(
      "TASK_NOT_FOUND"
    );
  }

  const allowed =
    await canManageTask(
      user,
      taskId
    );

  if (!allowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  return await deleteTask(
    user.company_id,
    taskId
  );
}

module.exports = {
  createNewTask,
  getCompanyTasks,
  getTask,
  updateExistingTask,
  deleteExistingTask
};