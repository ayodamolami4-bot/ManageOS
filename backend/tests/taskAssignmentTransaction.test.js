const test = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../src/db/database");
const { assignTaskAtomically, endTaskAssignmentAtomically } =
  require("../src/repositories/taskAssignmentRepository");

const base = {
  taskId: "613ac7e3-4770-44cc-bdd3-0470879607d0",
  companyId: "e8a0fecd-d568-4faf-a5c7-987a09c7d58f",
  userId: "b1c2d3e4-f5a6-47b8-9012-3456789abcde",
  assignedBy: "ca038e28-6db3-49ac-932b-1edcb92fed6f",
  estimatedEffortHours: 4,
};

function makeClient({ failNotification = false, alreadyAssigned = false } = {}) {
  const calls = [];
  const client = {
    query: async (sql, params) => {
      const statement = String(sql);
      calls.push(statement);
      if (statement.includes("FROM tasks") && statement.includes("FOR UPDATE")) {
        return { rows: [{ id: base.taskId, project_id: "20ea5be8-c83d-4ca2-a2a3-37d10b79e04a" }] };
      }
      if (statement.includes("FROM project_members")) return { rows: [{}] };
      if (statement.includes("SELECT id FROM task_assignments")) {
        return { rows: alreadyAssigned ? [{ id: "existing" }] : [] };
      }
      if (statement.includes("INSERT INTO task_assignments")) {
        return { rows: [{ id: "new-assignment", task_id: base.taskId, user_id: base.userId }] };
      }
      if (statement.includes("INSERT INTO notifications") && failNotification) {
        throw new Error("NOTIFICATION_INSERT_FAILED");
      }
      if (statement.includes("UPDATE task_assignments")) {
        return { rows: [{ id: "new-assignment", user_id: base.userId, ended_at: new Date() }] };
      }
      return { rows: [{}] };
    },
    release: () => { calls.push("RELEASE"); },
  };
  return { client, calls };
}

test("assignment and notification/audit commit as a unit", async (t) => {
  const { client, calls } = makeClient();
  t.mock.method(pool, "connect", async () => client);
  const assignment = await assignTaskAtomically(base);
  assert.equal(assignment.id, "new-assignment");
  assert.equal(calls[0], "BEGIN");
  assert.ok(calls.some((sql) => sql.includes("FOR UPDATE")));
  assert.ok(calls.some((sql) => sql.includes("INSERT INTO notifications")));
  assert.ok(calls.some((sql) => sql.includes("INSERT INTO activities")));
  assert.ok(calls.some((sql) => sql.includes("INSERT INTO audit_logs")));
  assert.ok(calls.includes("COMMIT"));
  assert.equal(calls.at(-1), "RELEASE");
});

test("failed notification rolls back the assignment and audit", async (t) => {
  const { client, calls } = makeClient({ failNotification: true });
  t.mock.method(pool, "connect", async () => client);
  await assert.rejects(assignTaskAtomically(base), /NOTIFICATION_INSERT_FAILED/);
  assert.ok(calls.includes("ROLLBACK"));
  assert.ok(!calls.includes("COMMIT"));
});

test("already active task assignment rejects without committing", async (t) => {
  const { client, calls } = makeClient({ alreadyAssigned: true });
  t.mock.method(pool, "connect", async () => client);
  await assert.rejects(assignTaskAtomically(base), /TASK_ALREADY_ASSIGNED/);
  assert.ok(calls.includes("ROLLBACK"));
  assert.ok(!calls.includes("COMMIT"));
});

test("ending an assignment records history within one transaction", async (t) => {
  const { client, calls } = makeClient();
  t.mock.method(pool, "connect", async () => client);
  await endTaskAssignmentAtomically({
    assignmentId: "new-assignment",
    taskId: base.taskId,
    companyId: base.companyId,
    endedBy: base.assignedBy,
  });
  assert.ok(calls.some((sql) => sql.includes("UPDATE task_assignments")));
  assert.ok(calls.some((sql) => sql.includes("INSERT INTO audit_logs")));
  assert.ok(calls.includes("COMMIT"));
});
