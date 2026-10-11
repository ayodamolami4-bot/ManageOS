const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const pool = require("../../src/db/database");
const app = require("../../src/app");
const { hashPassword } = require("../../src/utils/password");

const secret = "ManageOS-CI-Password-2026!";

async function newClient() {
  const agent = request.agent(app);
  const result = await agent.get("/api/auth/csrf");
  assert.equal(result.status, 200);
  return {
    agent,
    csrf: result.body.data.csrfToken,
    post(url, body) {
      return agent.post(url).set("X-CSRF-Token", this.csrf).send(body);
    },
    put(url, body) {
      return agent.put(url).set("X-CSRF-Token", this.csrf).send(body);
    },
    get(url) { return agent.get(url); },
  };
}

async function registerAndLogin(client, companyName, email) {
  const registration = await client.post("/api/auth/register/company", {
    companyName, firstName: "Owner", lastName: "Tester",
    email, password: secret,
  });
  assert.equal(registration.status, 201, JSON.stringify(registration.body));
  const login = await client.post("/api/auth/login", { email, password: secret });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  return { companyId: registration.body.data.company.id, userId: registration.body.data.user.id };
}

async function createEmployee(companyId, ownerId) {
  const passwordHash = await hashPassword(secret);
  const result = await pool.query(
    `INSERT INTO users (company_id, first_name, last_name, email, password_hash)
     VALUES ($1, 'Employee', 'Tester', 'employee-integration@manageos.test', $2)
     RETURNING id`,
    [companyId, passwordHash]
  );
  const employeeId = result.rows[0].id;
  await pool.query(
    `INSERT INTO user_roles (user_id, role_id, assigned_by)
     SELECT $1, id, $2 FROM roles
     WHERE name = 'EMPLOYEE' AND company_id IS NULL AND is_system = TRUE`,
    [employeeId, ownerId]
  );
  return employeeId;
}

test("PostgreSQL: company workflow, requests and tenant security", { skip: process.env.RUN_DB_INTEGRATION !== "1" }, async () => {
  const owner = await newClient();
  const employee = await newClient();
  const outsider = await newClient();

  try {
    const { companyId, userId: ownerId } = await registerAndLogin(
      owner, "Workflow Integration Ltd", "owner-integration@manageos.test"
    );
    const employeeId = await createEmployee(companyId, ownerId);

    const employeeLogin = await employee.post("/api/auth/login", {
      email: "employee-integration@manageos.test", password: secret,
    });
    assert.equal(employeeLogin.status, 200, JSON.stringify(employeeLogin.body));

    const { companyId: otherCompanyId } = await registerAndLogin(
      outsider, "Another Company Ltd", "other-owner@manageos.test"
    );
    assert.notEqual(otherCompanyId, companyId);

    const projectResult = await pool.query(
      `INSERT INTO projects (company_id, name, created_by)
       VALUES ($1, 'Integration project', $2) RETURNING id`,
      [companyId, ownerId]
    );
    const projectId = projectResult.rows[0].id;
    await pool.query(
      "INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)",
      [projectId, employeeId]
    );

    const taskResult = await owner.post("/api/tasks", {
      projectId, milestoneId: null, title: "Complete workflow",
      description: "Validate an end-to-end work cycle",
      priority: "HIGH", dueDate: null,
    });
    assert.equal(taskResult.status, 201, JSON.stringify(taskResult.body));
    const taskId = taskResult.body.data.id;

    const malformedAssignment = await owner.post(`/api/tasks/${taskId}/assignments`, {
      userId: employeeId, estimatedEffortHours: "many",
    });
    assert.equal(malformedAssignment.status, 400);

    const unassignedEmployee = await owner.post(`/api/tasks/${taskId}/assignments`, {
      userId: employeeId, estimatedEffortHours: 4.5,
    });
    assert.equal(unassignedEmployee.status, 409, JSON.stringify(unassignedEmployee.body));
    assert.equal(unassignedEmployee.body.error.code, "EMPLOYEE_UNIT_MEMBERSHIP_REQUIRED");

    const newUnit = await owner.post("/api/organization-units", {
      name: "Operations", type: "Department", parentUnitId: null, description: null,
    });
    assert.equal(newUnit.status, 201, JSON.stringify(newUnit.body));
    const organizationUnitId = newUnit.body.data.id;

    const memberAdded = await owner.post("/api/organization-memberships", {
      userId: employeeId, organizationUnitId,
    });
    assert.equal(memberAdded.status, 201, JSON.stringify(memberAdded.body));
    const employeeMemberships = await employee.get("/api/organization-memberships/me");
    assert.equal(employeeMemberships.status, 200, JSON.stringify(employeeMemberships.body));
    assert.ok(employeeMemberships.body.data.some((m) => m.organization_unit_id === organizationUnitId));

    const crossCompanyMembership = await outsider.get(
      `/api/organization-memberships/user/${employeeId}`
    );
    assert.ok([403, 404].includes(crossCompanyMembership.status));

    const assigned = await owner.post(`/api/tasks/${taskId}/assignments`, {
      userId: employeeId, estimatedEffortHours: 4.5,
    });
    assert.equal(assigned.status, 201, JSON.stringify(assigned.body));

    const duplicate = await owner.post(`/api/tasks/${taskId}/assignments`, {
      userId: employeeId, estimatedEffortHours: 4,
    });
    assert.equal(duplicate.status, 409);

    const assignedNotification = await pool.query(
      `SELECT 1 FROM notifications WHERE recipient_id=$1
       AND type='TASK_ASSIGNED' AND resource_id=$2`,
      [employeeId, taskId]
    );
    assert.equal(assignedNotification.rowCount, 1);

    const forbiddenOutsider = await outsider.get(`/api/tasks/${taskId}/submissions`);
    assert.ok([403, 404].includes(forbiddenOutsider.status));

    const started = await employee.put(`/api/tasks/${taskId}/status`, { newStatus: "IN_PROGRESS" });
    assert.equal(started.status, 200, JSON.stringify(started.body));

    const invalidSubmit = await employee.post(`/api/tasks/${taskId}/submissions`, {
      description: "   ",
    });
    assert.equal(invalidSubmit.status, 400);

    const submitted = await employee.post(`/api/tasks/${taskId}/submissions`, {
      description: "Completed the implementation and verified the result.",
    });
    assert.equal(submitted.status, 201, JSON.stringify(submitted.body));
    const submissionId = submitted.body.data.submission.id;

    const directComplete = await employee.put(`/api/tasks/${taskId}/status`, {
      newStatus: "COMPLETED",
    });
    assert.equal(directComplete.status, 400);

    const employeeReview = await employee.post(`/api/task-submissions/${submissionId}/reviews`, {
      decision: "APPROVED",
    });
    assert.equal(employeeReview.status, 403);

    const reviewed = await owner.post(`/api/task-submissions/${submissionId}/reviews`, {
      decision: "APPROVED", comment: "Validated",
    });
    assert.equal(reviewed.status, 201, JSON.stringify(reviewed.body));
    assert.equal(reviewed.body.data.task.status, "COMPLETED");

    const duplicateReview = await owner.post(`/api/task-submissions/${submissionId}/reviews`, {
      decision: "APPROVED",
    });
    assert.equal(duplicateReview.status, 422);

    const audits = await pool.query(
      "SELECT action FROM audit_logs WHERE company_id=$1 AND resource_id=$2",
      [companyId, taskId]
    );
    assert.ok(audits.rows.some((row) => row.action === "TASK_ASSIGNED"));
    assert.ok(audits.rows.some((row) => row.action === "TASK_SUBMITTED"));
    assert.ok(audits.rows.some((row) => row.action === "TASK_REVIEW_DECIDED"));

    const blockerTask = await owner.post("/api/tasks", {
      projectId, milestoneId: null, title: "Access blocked",
      description: null, priority: "MEDIUM", dueDate: null,
    });
    assert.equal(blockerTask.status, 201, JSON.stringify(blockerTask.body));
    const secondTaskId = blockerTask.body.data.id;
    const races = await Promise.all([
      owner.post(`/api/tasks/${secondTaskId}/assignments`, { userId: employeeId }),
      owner.post(`/api/tasks/${secondTaskId}/assignments`, { userId: employeeId }),
    ]);
    assert.deepEqual(races.map((result) => result.status).sort(), [201, 409]);
    const activeCount = await pool.query(
      "SELECT COUNT(*)::int AS total FROM task_assignments WHERE task_id=$1 AND ended_at IS NULL",
      [secondTaskId]
    );
    assert.equal(activeCount.rows[0].total, 1);

    const blocker = await employee.post(`/api/tasks/${secondTaskId}/blockers`, {
      title: "Access to the repository", description: "Cannot read the team repository.",
    });
    assert.equal(blocker.status, 201, JSON.stringify(blocker.body));
    const blockerId = blocker.body.data.id;
    const hiddenBlocker = await outsider.get(`/api/blockers/${blockerId}`);
    assert.equal(hiddenBlocker.status, 404);

    const resolvedBlocker = await owner.put(`/api/blockers/${blockerId}/resolve`, {});
    assert.equal(resolvedBlocker.status, 200, JSON.stringify(resolvedBlocker.body));
    assert.equal(resolvedBlocker.body.data.status, "RESOLVED");

    // Rejected work must return to the employee for changes and allow a new submission.
    const changeTask = await owner.post("/api/tasks", {
      projectId, milestoneId: null, title: "Review corrections",
      description: null, priority: "MEDIUM", dueDate: null,
    });
    assert.equal(changeTask.status, 201, JSON.stringify(changeTask.body));
    const thirdTaskId = changeTask.body.data.id;
    assert.equal((await owner.post(`/api/tasks/${thirdTaskId}/assignments`, { userId: employeeId })).status, 201);
    assert.equal((await employee.put(`/api/tasks/${thirdTaskId}/status`, { newStatus: "IN_PROGRESS" })).status, 200);
    const initialSubmission = await employee.post(`/api/tasks/${thirdTaskId}/submissions`, {
      description: "First attempt at delivery.",
    });
    assert.equal(initialSubmission.status, 201, JSON.stringify(initialSubmission.body));
    const firstSubmissionId = initialSubmission.body.data.submission.id;

    const emptyFeedback = await owner.post(`/api/task-submissions/${firstSubmissionId}/reviews`, {
      decision: "NEEDS_CHANGES", comment: "  ",
    });
    assert.equal(emptyFeedback.status, 400);

    const needsChanges = await owner.post(`/api/task-submissions/${firstSubmissionId}/reviews`, {
      decision: "NEEDS_CHANGES", comment: "Please add the missing tests.",
    });
    assert.equal(needsChanges.status, 201, JSON.stringify(needsChanges.body));
    assert.equal(needsChanges.body.data.task.status, "IN_PROGRESS");

    const resubmission = await employee.post(`/api/tasks/${thirdTaskId}/submissions`, {
      description: "Added the missing tests and reran the suite.",
    });
    assert.equal(resubmission.status, 201, JSON.stringify(resubmission.body));
    const approvedRetry = await owner.post(
      `/api/task-submissions/${resubmission.body.data.submission.id}/reviews`,
      { decision: "APPROVED", comment: "Accepted" }
    );
    assert.equal(approvedRetry.status, 201, JSON.stringify(approvedRetry.body));
    assert.equal(approvedRetry.body.data.task.status, "COMPLETED");

    const operationalRequest = await employee.post("/api/requests", {
      assignedTo: ownerId, type: "ACCESS", title: "Repository access",
      description: "Please add my account to the project.",
    });
    assert.equal(operationalRequest.status, 201, JSON.stringify(operationalRequest.body));
    const requestId = operationalRequest.body.data.id;

    const outsiderRequests = await outsider.get("/api/requests");
    assert.equal(outsiderRequests.status, 200);
    assert.equal(outsiderRequests.body.data.length, 0);

    const unauthorizedChange = await employee.put(`/api/requests/${requestId}/status`, {
      status: "RESOLVED",
    });
    assert.equal(unauthorizedChange.status, 403);

    const statusChange = await owner.put(`/api/requests/${requestId}/status`, {
      status: "RESOLVED",
    });
    assert.equal(statusChange.status, 200, JSON.stringify(statusChange.body));
    assert.equal(statusChange.body.data.status, "RESOLVED");

    const staleChange = await owner.put(`/api/requests/${requestId}/status`, {
      status: "IN_PROGRESS",
    });
    assert.equal(staleChange.status, 409);
  } finally {
    await pool.end();
  }
});
