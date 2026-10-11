const {
  createProject,
  getProjects,
  getProjectById,
  updateProject
} = require("../repositories/projectRepository");

const {
  canViewProject,
  canManageProject
} = require("./authorizationService");

async function createNewProject(
  {
    name,
    description,
    status,
    priority,
    startDate,
    dueDate
  },
  user
) {
  return await createProject({
    companyId: user.company_id,
    name,
    description,
    status: status || "PLANNED",
    priority: priority || "MEDIUM",
    startDate,
    dueDate,
    createdBy: user.id
  });
}

async function getCompanyProjects(user) {
  const projects = await getProjects(
    user.company_id
  );

  const visibleProjects = [];

  for (const project of projects) {
    const allowed =
      await canViewProject(
        user,
        project.id
      );

    if (allowed) {
      visibleProjects.push({ ...project, can_create_tasks: await canManageProject(user, project.id) });
    }
  }

  return visibleProjects;
}

async function getProject(
  projectId,
  user
) {
  const project =
    await getProjectById(
      user.company_id,
      projectId
    );

  if (!project) {
    throw new Error(
      "PROJECT_NOT_FOUND"
    );
  }

  return { ...project, can_manage: await canManageProject(user, projectId) };
}

async function updateExistingProject(
  {
    projectId,
    name,
    description,
    status,
    priority,
    startDate,
    dueDate
  },
  user
) {
  const existingProject =
    await getProjectById(
      user.company_id,
      projectId
    );

  if (!existingProject) {
    throw new Error(
      "PROJECT_NOT_FOUND"
    );
  }

  return await updateProject({
    companyId: user.company_id,
    projectId,
    name,
    description,
    status,
    priority,
    startDate,
    dueDate,
    updatedBy: user.id
  });
}

module.exports = {
  createNewProject,
  getCompanyProjects,
  getProject,
  updateExistingProject
};