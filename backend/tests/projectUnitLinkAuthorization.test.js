const test = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../src/db/database");
const {
  canLinkProjectOrganizationUnit
} = require("../src/services/authorizationService");
const {
  requireProjectUnitLinkManagement
} = require("../src/middleware/projectAuthorization");

const user = { id: "actor-id", company_id: "company-id" };
const projectId = "project-id";

function mockRole(t, role, { projectInCompany = true } = {}) {
  t.mock.method(pool, "query", async (sql, params = []) => {
    const query = String(sql).replace(/\s+/g, " ");

    if (query.includes("p.name = $2")) {
      return { rows: params[1] === "project.manage" && role !== "EMPLOYEE" ? [{}] : [] };
    }
    if (query.includes("FROM projects") && query.includes("WHERE id = $1")) {
      return { rows: projectInCompany ? [{}] : [] };
    }
    if (query.includes("r.name = 'OWNER'")) {
      return { rows: role === "OWNER" ? [{}] : [] };
    }
    if (query.includes("r.name = 'MANAGER'") && query.includes("AND ur.organization_unit_id IS NULL")) {
      return { rows: role === "MANAGER" ? [{}] : [] };
    }
    if (query.includes("r.name = 'MANAGER'")) {
      return { rows: ["MANAGER", "SCOPED_MANAGER"].includes(role) ? [{}] : [] };
    }
    if (query.includes("FROM project_leads")) {
      return { rows: role === "TEAM_LEAD" ? [{}] : [] };
    }

    throw new Error("Unexpected authorization query: " + query);
  });
}

test("Owner can link departments to an existing company project", async (t) => {
  mockRole(t, "OWNER");
  assert.equal(await canLinkProjectOrganizationUnit(user, projectId), true);
});

test("company-wide Manager can link departments", async (t) => {
  mockRole(t, "MANAGER");
  assert.equal(await canLinkProjectOrganizationUnit(user, projectId), true);
});

test("scoped Manager cannot expand a project's department scope", async (t) => {
  mockRole(t, "SCOPED_MANAGER");
  assert.equal(await canLinkProjectOrganizationUnit(user, projectId), false);
});

test("Team Lead assigned as project lead cannot link departments", async (t) => {
  mockRole(t, "TEAM_LEAD");
  assert.equal(await canLinkProjectOrganizationUnit(user, projectId), false);
});

test("Employee cannot link departments", async (t) => {
  mockRole(t, "EMPLOYEE");
  assert.equal(await canLinkProjectOrganizationUnit(user, projectId), false);
});

test("even an Owner cannot link departments to a project outside their company", async (t) => {
  mockRole(t, "OWNER", { projectInCompany: false });
  assert.equal(await canLinkProjectOrganizationUnit(user, projectId), false);
});

test("project-unit-link endpoint rejects Team Leads with HTTP 403", async (t) => {
  mockRole(t, "TEAM_LEAD");
  const res = {
    statusCode: null, body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  let nextCalled = false;
  await requireProjectUnitLinkManagement(
    { user, params: { projectId } },
    res,
    () => { nextCalled = true; }
  );
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error.code, "FORBIDDEN");
});

test("project-unit-link endpoint allows authorized company Manager", async (t) => {
  mockRole(t, "MANAGER");
  const res = {
    status() { throw new Error("Unexpected rejection"); },
    json() { throw new Error("Unexpected response"); }
  };
  let nextCalled = false;
  await requireProjectUnitLinkManagement(
    { user, params: { projectId } },
    res,
    () => { nextCalled = true; }
  );
  assert.equal(nextCalled, true);
});
