const {
  createDiscussion,
  getCompanyDiscussions,
  getDiscussionById,
  getResourceDiscussions
} = require("../repositories/discussionRepository");

const pool = require("../db/database");

const RESOURCE_TYPES = [
  "COMPANY",
  "PROJECT",
  "MILESTONE",
  "TASK"
];

async function verifyResourceBelongsToCompany(
  resourceType,
  resourceId,
  companyId
) {
  let query;
  let values;

  switch (resourceType) {
    case "COMPANY":
      query = `
        SELECT id
        FROM companies
        WHERE id = $1
          AND id = $2
        LIMIT 1
      `;
      values = [resourceId, companyId];
      break;

    case "PROJECT":
      query = `
        SELECT id
        FROM projects
        WHERE id = $1
          AND company_id = $2
        LIMIT 1
      `;
      values = [resourceId, companyId];
      break;

    case "MILESTONE":
      query = `
        SELECT m.id
        FROM milestones m
        JOIN projects p
          ON p.id = m.project_id
        WHERE m.id = $1
          AND p.company_id = $2
        LIMIT 1
      `;
      values = [resourceId, companyId];
      break;

    case "TASK":
      query = `
        SELECT id
        FROM tasks
        WHERE id = $1
          AND company_id = $2
        LIMIT 1
      `;
      values = [resourceId, companyId];
      break;

    default:
      throw new Error("INVALID_RESOURCE_TYPE");
  }

  const result = await pool.query(query, values);

  if (!result.rows[0]) {
    throw new Error("RESOURCE_NOT_FOUND");
  }
}

async function createNewDiscussion({
  resourceType,
  resourceId,
  title
}, user) {
  if (!RESOURCE_TYPES.includes(resourceType)) {
    throw new Error("INVALID_RESOURCE_TYPE");
  }

  if (!title || !title.trim()) {
    throw new Error("DISCUSSION_TITLE_REQUIRED");
  }

  await verifyResourceBelongsToCompany(
    resourceType,
    resourceId,
    user.company_id
  );

  return await createDiscussion({
    companyId: user.company_id,
    createdBy: user.id,
    resourceType,
    resourceId,
    title: title.trim()
  });
}

async function getDiscussions(user) {
  return await getCompanyDiscussions(
    user.company_id
  );
}

async function getDiscussion(
  discussionId,
  user
) {
  const discussion = await getDiscussionById(
    discussionId
  );

  if (
    !discussion ||
    discussion.company_id !== user.company_id
  ) {
    throw new Error("DISCUSSION_NOT_FOUND");
  }

  return discussion;
}

async function getDiscussionsForResource({
  resourceType,
  resourceId
}, user) {
  if (!RESOURCE_TYPES.includes(resourceType)) {
    throw new Error("INVALID_RESOURCE_TYPE");
  }

  await verifyResourceBelongsToCompany(
    resourceType,
    resourceId,
    user.company_id
  );

  return await getResourceDiscussions(
    user.company_id,
    resourceType,
    resourceId
  );
}

module.exports = {
  createNewDiscussion,
  getDiscussions,
  getDiscussion,
  getDiscussionsForResource
};