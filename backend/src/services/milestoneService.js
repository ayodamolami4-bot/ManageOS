const {
  createMilestone,
  getMilestones,
  getMilestoneById,
  updateMilestone,
  deleteMilestone
} = require("../repositories/milestoneRepository");

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

async function createNewMilestone({
  projectId,
  name,
  description,
  status,
  dueDate
}, user) {
  await verifyProjectBelongsToCompany(
    projectId,
    user.company_id
  );

  return await createMilestone({
    projectId,
    name,
    description,
    status: status || "PLANNED",
    dueDate,
    createdBy: user.id
  });
}

async function getProjectMilestones(projectId, user) {
  await verifyProjectBelongsToCompany(
    projectId,
    user.company_id
  );

  return await getMilestones(projectId);
}

async function getMilestone(projectId, milestoneId, user) {
  await verifyProjectBelongsToCompany(
    projectId,
    user.company_id
  );

  const milestone = await getMilestoneById(
    projectId,
    milestoneId
  );

  if (!milestone) {
    throw new Error("MILESTONE_NOT_FOUND");
  }

  return milestone;
}

async function updateExistingMilestone({
  projectId,
  milestoneId,
  name,
  description,
  status,
  dueDate
}, user) {
  await verifyProjectBelongsToCompany(
    projectId,
    user.company_id
  );

  const existingMilestone = await getMilestoneById(
    projectId,
    milestoneId
  );

  if (!existingMilestone) {
    throw new Error("MILESTONE_NOT_FOUND");
  }

  return await updateMilestone({
    projectId,
    milestoneId,
    name,
    description,
    status,
    dueDate
  });
}

async function deleteExistingMilestone(
  projectId,
  milestoneId,
  user
) {
  await verifyProjectBelongsToCompany(
    projectId,
    user.company_id
  );

  const existingMilestone = await getMilestoneById(
    projectId,
    milestoneId
  );

  if (!existingMilestone) {
    throw new Error("MILESTONE_NOT_FOUND");
  }

  return await deleteMilestone(
    projectId,
    milestoneId
  );
}

module.exports = {
  createNewMilestone,
  getProjectMilestones,
  getMilestone,
  updateExistingMilestone,
  deleteExistingMilestone
};