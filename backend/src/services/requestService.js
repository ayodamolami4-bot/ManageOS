const {
  createRequest,
  getCompanyRequests,
  getRequestById,
  updateRequestStatus
} = require("../repositories/requestRepository");

const pool = require("../db/database");

const REQUEST_TYPES = [
  "APPROVAL",
  "ACCESS",
  "DECISION",
  "HELP",
  "OTHER"
];

const REQUEST_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED"
];

async function verifyUserBelongsToCompany(
  userId,
  companyId
) {
  const result = await pool.query(
    `
    SELECT id
    FROM users
    WHERE id = $1
      AND company_id = $2
    LIMIT 1
    `,
    [userId, companyId]
  );

  if (!result.rows[0]) {
    throw new Error("USER_NOT_FOUND");
  }
}

async function createNewRequest({
  assignedTo,
  type,
  title,
  description
}, user) {
  if (!REQUEST_TYPES.includes(type)) {
    throw new Error("INVALID_REQUEST_TYPE");
  }

  if (!title || !title.trim()) {
    throw new Error("REQUEST_TITLE_REQUIRED");
  }

  if (assignedTo) {
    await verifyUserBelongsToCompany(
      assignedTo,
      user.company_id
    );
  }

  return await createRequest({
    companyId: user.company_id,
    requestedBy: user.id,
    assignedTo,
    type,
    title: title.trim(),
    description
  });
}

async function getRequests(user) {
  return await getCompanyRequests(
    user.company_id
  );
}

async function getRequest(requestId, user) {
  const request = await getRequestById(requestId);

  if (
    !request ||
    request.company_id !== user.company_id
  ) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  return request;
}

async function changeRequestStatus(
  requestId,
  status,
  user
) {
  if (!REQUEST_STATUSES.includes(status)) {
    throw new Error("INVALID_REQUEST_STATUS");
  }

  const request = await getRequest(
    requestId,
    user
  );

  if (request.status === status) {
    throw new Error("REQUEST_STATUS_UNCHANGED");
  }

  return await updateRequestStatus(
    requestId,
    status
  );
}

module.exports = {
  createNewRequest,
  getRequests,
  getRequest,
  changeRequestStatus
};