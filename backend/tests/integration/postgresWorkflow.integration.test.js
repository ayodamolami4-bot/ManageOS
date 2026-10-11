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
    remove(url) { return agent.delete(url).set("X-CSRF-Token", this.csrf); },
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

async function createManager(companyId, ownerId, email = "manager-integration@manageos.test") {
  const result = await pool.query(
    `INSERT INTO users (company_id, first_name, last_name, email, password_hash)
     VALUES ($1, 'Manager', 'Tester', $2, $3)
     RETURNING id`,
    [companyId, email, await hashPassword(secret)]
  );
  const managerId = result.rows[0].id;
  await pool.query(
    `INSERT INTO user_roles (user_id, role_id, assigned_by)
     SELECT $1, id, $2 FROM roles
     WHERE name = 'MANAGER' AND company_id IS NULL AND is_system = TRUE`,
    [managerId, ownerId]
  );
  return managerId;
}

async function createScopedTeamLead(companyId, ownerId, unitId) {
  const result = await pool.query(
    `INSERT INTO users (company_id, first_name, last_name, email, password_hash)
     VALUES ($1, 'Lead', 'Tester', 'teamlead-integration@manageos.test', $2)
     RETURNING id`,
    [companyId, await hashPassword(secret)]
  );
  const leadId = result.rows[0].id;
  await pool.query(
    `INSERT INTO user_roles (user_id, role_id, organization_unit_id, assigned_by)
     SELECT $1, id, $2, $3 FROM roles
     WHERE name = 'TEAM_LEAD' AND company_id IS NULL AND is_system = TRUE`,
    [leadId, unitId, ownerId]
  );
  return leadId;
}

test("PostgreSQL: company workflow, requests and tenant security", { skip: process.env.RUN_DB_INTEGRATION !== "1" }, async () => {
  const owner = await newClient();
  const employee = await newClient();
  const outsider = await newClient();
  const scopedLead = await newClient();

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
    const managerId = await createManager(companyId, ownerId);
    const rolesResponse = await owner.get("/api/users/roles");
    assert.equal(rolesResponse.status, 200, JSON.stringify(rolesResponse.body));
    const managerRole = rolesResponse.body.data.find((role) => role.name === "MANAGER");
    assert.ok(managerRole?.id);
    const duplicateCompanyRole = await owner.post(`/api/users/${managerId}/roles`, {
      roleId: managerRole.id, organizationUnitId: null,
    });
    assert.equal(duplicateCompanyRole.status, 409, JSON.stringify(duplicateCompanyRole.body));
    const linkedUnit = await owner.post(
      `/api/project-relationships/${projectId}/organization-units`,
      { organizationUnitId }
    );
    assert.equal(linkedUnit.status, 201, JSON.stringify(linkedUnit.body));

    const employeeCannotPromote = await employee.post(
      `/api/project-relationships/${projectId}/leads`, { userId: employeeId }
    );
    assert.equal(employeeCannotPromote.status, 403);

    const invalidRelationship = await owner.post(
      `/api/project-relationships/${projectId}/members`, { userId: "123" }
    );
    assert.equal(invalidRelationship.status, 400);

    const unauthorizedLead = await owner.post(
      `/api/project-relationships/${projectId}/leads`, { userId: employeeId }
    );
    assert.equal(unauthorizedLead.status, 422, JSON.stringify(unauthorizedLead.body));

    const validLead = await owner.post(
      `/api/project-relationships/${projectId}/leads`, { userId: managerId }
    );
    assert.equal(validLead.status, 201, JSON.stringify(validLead.body));
    const managerMembership = await owner.post(
      `/api/project-relationships/${projectId}/members`, { userId: managerId }
    );
    assert.equal(managerMembership.status, 201, JSON.stringify(managerMembership.body));

    const projectHistory = await pool.query(
      `SELECT action FROM audit_logs WHERE company_id = $1
       AND resource_type = 'PROJECT' AND resource_id = $2`,
      [companyId, projectId]
    );
    assert.ok(projectHistory.rows.some((row) => row.action === "PROJECT_LEAD_ASSIGNED"));
    assert.ok(projectHistory.rows.some((row) => row.action === "PROJECT_MEMBER_ADDED"));
    assert.ok(projectHistory.rows.some((row) => row.action === "PROJECT_UNIT_LINKED"));

    const leads = await employee.get(`/api/project-relationships/${projectId}/leads`);
    assert.equal(leads.status, 200, JSON.stringify(leads.body));
    assert.ok(leads.body.data.some((lead) => lead.id === managerId));

    const projectUnits = await employee.get(
      `/api/project-relationships/${projectId}/organization-units`
    );
    assert.equal(projectUnits.status, 200, JSON.stringify(projectUnits.body));
    assert.ok(projectUnits.body.data.some((unit) => unit.id === organizationUnitId));

    const otherCompanyUnit = await outsider.post("/api/organization-units", {
      name: "Other company team", type: "Department", parentUnitId: null, description: null,
    });
    assert.equal(otherCompanyUnit.status, 201, JSON.stringify(otherCompanyUnit.body));

    const crossCompanyLink = await owner.post(
      `/api/project-relationships/${projectId}/organization-units`,
      { organizationUnitId: otherCompanyUnit.body.data.id }
    );
    assert.equal(crossCompanyLink.status, 404);
    const secondUnit = await owner.post("/api/organization-units", {
      name: "Product", type: "Department", parentUnitId: null, description: null,
    });
    assert.equal(secondUnit.status, 201, JSON.stringify(secondUnit.body));
    const scopedLeadId = await createScopedTeamLead(companyId, ownerId, secondUnit.body.data.id);
    const scopedBeforeLink = await owner.post(
      `/api/project-relationships/${projectId}/leads`, { userId: scopedLeadId }
    );
    assert.equal(scopedBeforeLink.status, 422);

    const secondUnitLink = await owner.post(
      `/api/project-relationships/${projectId}/organization-units`,
      { organizationUnitId: secondUnit.body.data.id }
    );
    assert.equal(secondUnitLink.status, 201, JSON.stringify(secondUnitLink.body));
    const scopedAfterLink = await owner.post(
      `/api/project-relationships/${projectId}/leads`, { userId: scopedLeadId }
    );
    assert.equal(scopedAfterLink.status, 201, JSON.stringify(scopedAfterLink.body));

    const leadLogin = await scopedLead.post("/api/auth/login", {
      email: "teamlead-integration@manageos.test", password: secret,
    });
    assert.equal(leadLogin.status, 200, JSON.stringify(leadLogin.body));
    const leadProjectAccess = await scopedLead.get(
      `/api/project-relationships/${projectId}/members`
    );
    assert.equal(leadProjectAccess.status, 200, JSON.stringify(leadProjectAccess.body));


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

    // Removing a member with active assignments must be rejected.
    const prematureRemoval = await owner.remove(
      `/api/project-relationships/${projectId}/members/${employeeId}`
    );
    assert.equal(prematureRemoval.status, 409, JSON.stringify(prematureRemoval.body));
    assert.equal(prematureRemoval.body.error.code, "PROJECT_MEMBER_HAS_ACTIVE_TASKS");

    // Handoff must preserve one active assignment, and create audit history.
    const handoffTask = await owner.post("/api/tasks", {
      projectId, milestoneId: null, title: "Reassignment handoff",
      description: null, priority: "MEDIUM", dueDate: null,
    });
    assert.equal(handoffTask.status, 201, JSON.stringify(handoffTask.body));
    const handoffTaskId = handoffTask.body.data.id;
    const originalHandoff = await owner.post(
      `/api/tasks/${handoffTaskId}/assignments`, { userId: employeeId }
    );
    assert.equal(originalHandoff.status, 201, JSON.stringify(originalHandoff.body));

    const invalidHandoff = await owner.put(
      `/api/task-assignments/${originalHandoff.body.data.id}/reassign`,
      { userId: "not-a-uuid" }
    );
    assert.equal(invalidHandoff.status, 400);

    const notProjectMember = await owner.put(
      `/api/task-assignments/${originalHandoff.body.data.id}/reassign`,
      { userId: ownerId }
    );
    assert.equal(notProjectMember.status, 409);
    const handoff = await owner.put(
      `/api/task-assignments/${originalHandoff.body.data.id}/reassign`,
      { userId: managerId, estimatedEffortHours: 6 }
    );
    assert.equal(handoff.status, 200, JSON.stringify(handoff.body));
    assert.equal(handoff.body.data.user_id, managerId);
    const handoffState = await pool.query(
      `SELECT user_id, ended_at FROM task_assignments
       WHERE task_id = $1 ORDER BY assigned_at ASC`,
      [handoffTaskId]
    );
    assert.equal(handoffState.rows.length, 2);
    assert.equal(handoffState.rows.filter((row) => row.ended_at === null).length, 1);
    assert.equal(handoffState.rows.find((row) => row.ended_at === null).user_id, managerId);
    const handoffAudit = await pool.query(
      `SELECT 1 FROM audit_logs WHERE company_id = $1
       AND resource_id = $2 AND action = 'TASK_REASSIGNED'`,
      [companyId, handoffTaskId]
    );
    assert.equal(handoffAudit.rowCount, 1);

    // End remaining employee assignments, then remove the project member.
    const formerAssignments = await pool.query(
      `SELECT ta.id FROM task_assignments ta
       JOIN tasks t ON t.id = ta.task_id
       WHERE t.project_id = $1 AND ta.user_id = $2 AND ta.ended_at IS NULL`,
      [projectId, employeeId]
    );
    for (const assignment of formerAssignments.rows) {
      const ended = await owner.put(
        `/api/task-assignments/${assignment.id}/end`, {}
      );
      assert.equal(ended.status, 200, JSON.stringify(ended.body));
    }
    const removed = await owner.remove(
      `/api/project-relationships/${projectId}/members/${employeeId}`
    );
    assert.equal(removed.status, 200, JSON.stringify(removed.body));
    const oldMember = await owner.get(
      `/api/project-relationships/${projectId}/members`
    );
    assert.equal(oldMember.status, 200);
    assert.ok(!oldMember.body.data.some((member) => member.id === employeeId));

    const forbiddenRemoval = await outsider.remove(
      `/api/project-relationships/${projectId}/members/${managerId}`
    );
    assert.equal(forbiddenRemoval.status, 403);

    const lastManagerRemoval = await owner.remove(
      `/api/project-relationships/${projectId}/leads/${managerId}`
    );
    assert.equal(lastManagerRemoval.status, 409, JSON.stringify(lastManagerRemoval.body));
    assert.equal(lastManagerRemoval.body.error.code, "LAST_PROJECT_MANAGER");
    const secondManagerId = await createManager(
      companyId, ownerId, "manager-two-integration@manageos.test"
    );
    const managerReplacement = await owner.post(
      `/api/project-relationships/${projectId}/leads`, { userId: secondManagerId }
    );
    assert.equal(managerReplacement.status, 201, JSON.stringify(managerReplacement.body));

    const managerTaskEnded = await owner.put(
      `/api/task-assignments/${handoff.body.data.id}/end`, {}
    );
    assert.equal(managerTaskEnded.status, 200, JSON.stringify(managerTaskEnded.body));

    const cannotRemoveLeadMember = await owner.remove(
      `/api/project-relationships/${projectId}/members/${managerId}`
    );
    assert.equal(cannotRemoveLeadMember.status, 409, JSON.stringify(cannotRemoveLeadMember.body));
    assert.equal(cannotRemoveLeadMember.body.error.code, "REMOVE_PROJECT_LEAD_FIRST");

    const leadRetired = await owner.remove(
      `/api/project-relationships/${projectId}/leads/${managerId}`
    );
    assert.equal(leadRetired.status, 200, JSON.stringify(leadRetired.body));
    const managerMemberRemoved = await owner.remove(
      `/api/project-relationships/${projectId}/members/${managerId}`
    );
    assert.equal(managerMemberRemoved.status, 200, JSON.stringify(managerMemberRemoved.body));

    const removalAudit = await pool.query(
      `SELECT action FROM audit_logs WHERE company_id = $1
       AND resource_id = $2 AND action IN ('PROJECT_LEAD_REMOVED','PROJECT_MEMBER_REMOVED')`,
      [companyId, projectId]
    );
    assert.ok(removalAudit.rows.some((row) => row.action === "PROJECT_LEAD_REMOVED"));
    assert.ok(removalAudit.rows.some((row) => row.action === "PROJECT_MEMBER_REMOVED"));


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
