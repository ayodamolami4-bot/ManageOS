const pool = require("../db/database");
const { createNotificationWithClient } = require("./notificationRepository");
const { createActivityWithClient } = require("./activityRepository");
const { createAuditLogWithClient } = require("./auditLogRepository");

async function createRequest({
  companyId, requestedBy, assignedTo, type, title, description,
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO requests
       (company_id, requested_by, assigned_to, type, title, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [companyId, requestedBy, assignedTo ?? null, type, title, description ?? null]
    );
    const request = result.rows[0];

    if (assignedTo && assignedTo !== requestedBy) {
      await createNotificationWithClient(client, {
        recipientId: assignedTo, type: "REQUEST_ASSIGNED",
        title: "New operational request",
        message: "An operational request has been assigned to you.",
        resourceType: "REQUEST", resourceId: request.id,
      });
    }
    await createActivityWithClient(client, {
      companyId, actorId: requestedBy, action: "REQUEST_CREATED",
      resourceType: "REQUEST", resourceId: request.id,
      metadata: { type, assigned_to: assignedTo ?? null },
    });
    await createAuditLogWithClient(client, {
      companyId, actorId: requestedBy, action: "REQUEST_CREATED",
      resourceType: "REQUEST", resourceId: request.id,
      newValues: { type, title, assigned_to: assignedTo ?? null, status: "OPEN" },
    });
    await client.query("COMMIT");
    return request;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getCompanyRequests(companyId, userId) {
  const result = await pool.query(
    `SELECT id, company_id, requested_by, assigned_to, type,
            title, description, status, created_at, updated_at
     FROM requests
     WHERE company_id = $1
       AND (requested_by = $2 OR assigned_to = $2)
     ORDER BY created_at DESC`,
    [companyId, userId]
  );
  return result.rows;
}

async function getRequestById(requestId, companyId, userId) {
  const result = await pool.query(
    `SELECT id, company_id, requested_by, assigned_to, type,
            title, description, status, created_at, updated_at
     FROM requests
     WHERE id = $1 AND company_id = $2
       AND (requested_by = $3 OR assigned_to = $3)
     LIMIT 1`,
    [requestId, companyId, userId]
  );
  return result.rows[0];
}

async function updateRequestStatus(requestId, status, user) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const selected = await client.query(
      `SELECT id, requested_by, assigned_to, status FROM requests
       WHERE id = $1 AND company_id = $2 FOR UPDATE`,
      [requestId, user.company_id]
    );
    const request = selected.rows[0];
    if (!request ||
      (request.requested_by !== user.id && request.assigned_to !== user.id)) {
      throw new Error("REQUEST_NOT_FOUND");
    }
    if (request.assigned_to && request.assigned_to !== user.id) {
      throw new Error("FORBIDDEN");
    }
    if (request.status === status) throw new Error("REQUEST_STATUS_UNCHANGED");
    if (!["OPEN", "IN_PROGRESS"].includes(request.status) ||
        !["IN_PROGRESS", "RESOLVED", "REJECTED"].includes(status) ||
        (request.status === "IN_PROGRESS" && status === "IN_PROGRESS")) {
      throw new Error("INVALID_REQUEST_TRANSITION");
    }
    const updated = await client.query(
      `UPDATE requests SET status = $1, updated_at = NOW()
       WHERE id = $2 AND company_id = $3 RETURNING *`,
      [status, requestId, user.company_id]
    );
    if (request.requested_by !== user.id) {
      await createNotificationWithClient(client, {
        recipientId: request.requested_by, type: "REQUEST_UPDATED",
        title: "Your request was updated",
        message: "An operational request has a new status.",
        resourceType: "REQUEST", resourceId: requestId,
      });
    }
    await createActivityWithClient(client, {
      companyId: user.company_id, actorId: user.id, action: "REQUEST_STATUS_CHANGED",
      resourceType: "REQUEST", resourceId: requestId,
      metadata: { previous_status: request.status, status },
    });
    await createAuditLogWithClient(client, {
      companyId: user.company_id, actorId: user.id, action: "REQUEST_STATUS_CHANGED",
      resourceType: "REQUEST", resourceId: requestId,
      oldValues: { status: request.status }, newValues: { status },
    });
    await client.query("COMMIT");
    return updated.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createRequest,
  getCompanyRequests,
  getRequestById,
  updateRequestStatus,
};
