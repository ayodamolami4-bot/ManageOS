const {
  getCompanyActivities,
  getActivityById
} = require("../repositories/activityRepository");

function parsePositiveInteger(
  value,
  defaultValue,
  maxValue
) {
  if (value === undefined) {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("INVALID_ACTIVITY_FILTERS");
  }

  if (parsed > maxValue) {
    return maxValue;
  }

  return parsed;
}

function validateDate(value) {
  if (value === undefined) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("INVALID_ACTIVITY_FILTERS");
  }

  return date.toISOString();
}

async function getActivities(user, query = {}) {
  const page = parsePositiveInteger(
    query.page,
    1,
    Number.MAX_SAFE_INTEGER
  );

  const limit = parsePositiveInteger(
    query.limit,
    50,
    100
  );

  const offset = (page - 1) * limit;

  const from = validateDate(query.from);
  const to = validateDate(query.to);

  if (from && to && new Date(from) > new Date(to)) {
    throw new Error("INVALID_ACTIVITY_FILTERS");
  }

  const actorId = query.actorId || undefined;
  const resourceId = query.resourceId || undefined;

  const action = query.action
    ? query.action.trim().toUpperCase()
    : undefined;

  const resourceType = query.resourceType
    ? query.resourceType.trim().toUpperCase()
    : undefined;

  const result = await getCompanyActivities({
    companyId: user.company_id,
    actorId,
    action,
    resourceType,
    resourceId,
    from,
    to,
    limit,
    offset
  });

  const totalPages =
    result.total === 0
      ? 0
      : Math.ceil(result.total / limit);

  return {
    items: result.activities,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
}

async function getActivity(
  activityId,
  user
) {
  const activity = await getActivityById(
    user.company_id,
    activityId
  );

  if (!activity) {
    throw new Error("ACTIVITY_NOT_FOUND");
  }

  return activity;
}

module.exports = {
  getActivities,
  getActivity
};