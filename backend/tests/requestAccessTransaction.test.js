const test = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../src/db/database");
const repo = require("../src/repositories/requestRepository");

const companyId = "613ac7e3-4770-44cc-bdd3-0470879607d0";
const userId = "a5f2e471-3d83-4652-a089-38736566a120";
const assigneeId = "f4a28937-4e09-4bda-990c-fcf25a864470";
const requestId = "190746ca-7283-4b4c-9ee6-c1cadb147755";

function makeClient({ assignee = assigneeId, failNotification = false, status = "OPEN" } = {}) {
  const calls = [];
  const client = {
    query: async (sql, params = []) => {
      calls.push({ sql: String(sql), params });
      if (String(sql).includes("FROM requests") && String(sql).includes("FOR UPDATE")) {
        return { rows: [{ id: requestId, requested_by: userId, assigned_to: assignee, status }] };
      }
      if (String(sql).includes("INSERT INTO requests")) {
        return { rows: [{ id: requestId, company_id: companyId, requested_by: userId, assigned_to: assignee, status: "OPEN" }] };
      }
      if (String(sql).includes("UPDATE requests")) {
        return { rows: [{ id: requestId, status: params[0], requested_by: userId, assigned_to: assignee }] };
      }
      if (String(sql).includes("INSERT INTO notifications") && failNotification) {
        throw new Error("NOTIFICATION_FAILED");
      }
      return { rows: [{}] };
    },
    release() { calls.push({ sql: "RELEASE" }); },
  };
  return { client, calls };
}

test("request listing is scoped to company and requesting/assigned user", async (t) => {
  const calls = [];
  t.mock.method(pool, "query", async (sql, params) => {
    calls.push({ sql, params });
    return { rows: [] };
  });
  await repo.getCompanyRequests(companyId, userId);
  await repo.getRequestById(requestId, companyId, userId);
  assert.deepEqual(calls[0].params, [companyId, userId]);
  assert.match(calls[0].sql, /requested_by\s*=\s*\$2\s+OR\s+assigned_to\s*=\s*\$2/i);
  assert.deepEqual(calls[1].params, [requestId, companyId, userId]);
});

test("created requests commit notification and audit as a unit", async (t) => {
  const { client, calls } = makeClient();
  t.mock.method(pool, "connect", async () => client);
  await repo.createRequest({
    companyId, requestedBy: userId, assignedTo: assigneeId,
    type: "HELP", title: "Need access", description: null,
  });
  assert.equal(calls[0].sql, "BEGIN");
  assert.ok(calls.some((call) => call.sql.includes("INSERT INTO notifications")));
  assert.ok(calls.some((call) => call.sql.includes("INSERT INTO audit_logs")));
  assert.ok(calls.some((call) => call.sql === "COMMIT"));
  assert.equal(calls.at(-1).sql, "RELEASE");
});

test("notification failure rolls back request creation", async (t) => {
  const { client, calls } = makeClient({ failNotification: true });
  t.mock.method(pool, "connect", async () => client);
  await assert.rejects(repo.createRequest({
    companyId, requestedBy: userId, assignedTo: assigneeId,
    type: "HELP", title: "Need access",
  }), /NOTIFICATION_FAILED/);
  assert.ok(calls.some((call) => call.sql === "ROLLBACK"));
  assert.ok(!calls.some((call) => call.sql === "COMMIT"));
});

test("requester cannot change an assigned recipient's request", async (t) => {
  const { client, calls } = makeClient();
  t.mock.method(pool, "connect", async () => client);
  await assert.rejects(repo.updateRequestStatus(requestId, "RESOLVED", {
    company_id: companyId, id: userId,
  }), /FORBIDDEN/);
  assert.ok(calls.some((call) => call.sql === "ROLLBACK"));
  assert.ok(!calls.some((call) => call.sql.includes("UPDATE requests")));
});

test("authorized recipient can resolve request with an audit trail", async (t) => {
  const { client, calls } = makeClient();
  t.mock.method(pool, "connect", async () => client);
  const result = await repo.updateRequestStatus(requestId, "RESOLVED", {
    company_id: companyId, id: assigneeId,
  });
  assert.equal(result.status, "RESOLVED");
  assert.ok(calls.some((call) => call.sql.includes("FOR UPDATE")));
  assert.ok(calls.some((call) => call.sql.includes("INSERT INTO notifications")));
  assert.ok(calls.some((call) => call.sql.includes("INSERT INTO audit_logs")));
  assert.ok(calls.some((call) => call.sql === "COMMIT"));
});

test("resolved requests cannot be reopened", async (t) => {
  const { client, calls } = makeClient({ status: "RESOLVED" });
  t.mock.method(pool, "connect", async () => client);
  await assert.rejects(repo.updateRequestStatus(requestId, "IN_PROGRESS", {
    company_id: companyId, id: assigneeId,
  }), /INVALID_REQUEST_TRANSITION/);
  assert.ok(calls.some((call) => call.sql === "ROLLBACK"));
});
