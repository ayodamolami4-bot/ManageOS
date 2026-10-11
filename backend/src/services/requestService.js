const {
  createRequest,
  getCompanyRequests,
  getRequestById,
  updateRequestStatus,
  getRequestRecipients
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
  return await getCompanyRequests(user.company_id, user.id);
}

async function getRequest(requestId, user) {
  const request = await getRequestById(requestId, user.company_id, user.id);
  if (!request) throw new Error("REQUEST_NOT_FOUND");
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

  // This transaction locks the request and re-checks scope and permissions
  // after acquiring the lock, preventing concurrent status races.
  return updateRequestStatus(requestId, status, user);
}

async function listRequestRecipients(user) {
  return getRequestRecipients(user.company_id, user.id);
}

module.exports = {
  createNewRequest,
  getRequests,
  getRequest,
  changeRequestStatus,
  listRequestRecipients
};