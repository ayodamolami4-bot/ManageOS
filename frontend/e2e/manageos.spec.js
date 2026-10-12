import { Buffer } from "node:buffer";
import { test, expect } from "@playwright/test";

const PASSWORD = "ManageOS-Browser-Tests-2026!";

async function signIn(page, email) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in to ManageOS" }).click();
  await expect(page).toHaveURL(/\/app\/overview$/);
  await expect(page.getByText("Company Overview").first()).toBeVisible();
}

async function inviteAndJoin(owner, invitedPage, { email, firstName, role, unitName }) {
  await owner.goto("/app/people");
  await owner.getByRole("button", { name: "Invite person" }).click();
  await owner.locator("#invite-person-email").fill(email);
  await owner.locator("#invite-person-role").selectOption({ label: role });
  if (unitName) {
    await owner.locator("#invite-person-unit").selectOption({ label: unitName });
  }
  await owner.getByRole("button", { name: "Create invitation" }).click();

  const inviteLink = owner.locator('a[href*="/invite?token="]');
  await expect(inviteLink).toBeVisible();
  const href = await inviteLink.getAttribute("href");
  await invitedPage.goto(href);
  await invitedPage.locator("#invite-first").fill(firstName);
  await invitedPage.locator("#invite-last").fill("Tester");
  await invitedPage.locator("#invite-password").fill(PASSWORD);
  await invitedPage.locator("#invite-confirm").fill(PASSWORD);
  await invitedPage.getByRole("button", { name: "Accept invitation" }).click();
  await expect(invitedPage).toHaveURL(/\/login$/);
  await signIn(invitedPage, email);
}

test("protected routes and actual registration field errors", async ({ page }) => {
  await page.goto("/app/work");
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/register");
  await page.locator("#companyName").fill("Browser Quality Company");
  await page.locator("#firstName").fill("12345");
  await page.locator("#lastName").fill("Tester");
  await page.locator("#register-email").fill("browser-validation@manageos.test");
  await page.locator("#register-password").fill(PASSWORD);
  await page.locator("#confirm-password").fill("different-password");
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole("button", { name: /Create ManageOS account/ }).click();

  await expect(page.getByText(/First name must contain letters/i)).toBeVisible();
  await expect(page.getByText(/Passwords do not match/i)).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});

test("real browser: owner invites employee, assigns, reviews and approves work", async ({ browser }) => {
  test.setTimeout(240_000);
  const ownerContext = await browser.newContext();
  const employeeContext = await browser.newContext();
  const managerContext = await browser.newContext();
  const leadContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  const employee = await employeeContext.newPage();
  const manager = await managerContext.newPage();
  const lead = await leadContext.newPage();
  const id = Date.now().toString(36);
  const ownerEmail = `owner-${id}@manageos.test`;
  const employeeEmail = `worker-${id}@manageos.test`;
  const unitName = `Operations ${id}`;
  const projectName = `Customer Delivery ${id}`;
  const taskTitle = `Ship browser workflow ${id}`;

  try {
    await owner.goto("/register");
    await owner.locator("#companyName").fill(`Browser Company ${id}`);
    await owner.locator("#firstName").fill("Owner");
    await owner.locator("#lastName").fill("Tester");
    await owner.locator("#register-email").fill(ownerEmail);
    await owner.locator("#register-password").fill(PASSWORD);
    await owner.locator("#confirm-password").fill(PASSWORD);
    await owner.locator('input[type="checkbox"]').check();
    await owner.getByRole("button", { name: /Create ManageOS account/ }).click();
    await expect(owner).toHaveURL(/\/login$/);
    await signIn(owner, ownerEmail);
    await expect(owner.getByText(`Browser Company ${id}`).first()).toBeVisible();
    await expect(owner.getByRole("link", { name: "Activity", exact: true })).toBeVisible();
    await expect(owner.getByRole("link", { name: "Audit", exact: true })).toBeVisible();

    await owner.goto("/app/organization");
    await owner.getByRole("button", { name: "Add organization unit" }).click();
    await owner.locator("#unit-name").fill(unitName);
    await owner.locator("#unit-type").fill("Department");
    await owner.getByRole("button", { name: "Create unit" }).click();
    await expect(owner.getByRole("heading", { name: unitName })).toBeVisible();

    await owner.goto("/app/projects");
    await owner.getByRole("button", { name: "Create project" }).click();
    await owner.locator("#work-name").fill(projectName);
    await owner.getByRole("button", { name: "Create project" }).last().click();
    const projectLink = owner.getByRole("link", { name: projectName });
    await expect(projectLink).toBeVisible();
    const projectPath = await projectLink.getAttribute("href");
    expect(projectPath).toMatch(/^\/app\/projects\/[0-9a-f-]+$/i);
    // The Goals -> Projects promise is backed by a real saved relationship.
    await owner.goto("/app/goals");
    await owner.getByRole("button", { name: "Create goal" }).first().click();
    const goalTitle = `Improve delivery quality ${id}`;
    await owner.locator("#work-title").fill(goalTitle);
    await owner.getByRole("button", { name: "Create goal" }).last().click();
    const goalCard = owner.locator("article.workspace-data-item").filter({
      has: owner.getByRole("heading", { name: goalTitle }),
    });
    await expect(goalCard).toBeVisible();
    await goalCard.getByRole("button", { name: "Linked projects" }).click();
    await goalCard.locator('select[id^="goal-project-"]').selectOption({ label: projectName });
    await goalCard.getByRole("button", { name: "Link project" }).click();
    await expect(goalCard.getByText("Project linked to this goal.")).toBeVisible();

    await owner.goto(projectPath);
    await expect(owner.getByRole("heading", { name: "Company goals supported" })).toBeVisible();
    await expect(owner.getByText(goalTitle)).toBeVisible();

    await owner.goto(projectPath);

    // Milestone editing must persist through the real API and reject invalid input.
    await owner.getByRole("button", { name: "Add milestone" }).click();
    const initialMilestoneName = `Initial delivery ${id}`;
    const revisedMilestoneName = `Release candidate ${id}`;
    await owner.locator("#milestone-name").fill(initialMilestoneName);
    await owner.getByRole("button", { name: "Create milestone" }).click();
    const milestoneCard = owner.locator("article.workspace-data-item").filter({
      has: owner.getByRole("heading", { name: initialMilestoneName })
    });
    await expect(milestoneCard).toBeVisible();
    await milestoneCard.getByRole("button", { name: "Edit milestone" }).click();
    await owner.locator("#edit-milestone-name").fill("");
    await owner.getByRole("button", { name: "Save milestone" }).click();
    await expect(owner.getByText("Milestone name is required.")).toBeVisible();
    await owner.locator("#edit-milestone-name").fill(revisedMilestoneName);
    await owner.locator("#edit-milestone-status").selectOption("IN_PROGRESS");
    await owner.getByRole("button", { name: "Save milestone" }).click();
    await expect(owner.getByText("Milestone updated.")).toBeVisible();
    await expect(owner.getByRole("heading", { name: revisedMilestoneName })).toBeVisible();
    await owner.reload();
    const revisedMilestone = owner.locator("article.workspace-data-item").filter({
      has: owner.getByRole("heading", { name: revisedMilestoneName })
    });
    await expect(revisedMilestone.getByText("Status: IN PROGRESS")).toBeVisible();

    await owner.locator("#project-link-unit").selectOption({ label: unitName });
    await owner.getByRole("button", { name: "Link unit" }).click();
    await expect(owner.getByText(unitName).first()).toBeVisible();

    await owner.goto("/app/people");
    await owner.getByRole("button", { name: "Invite person" }).click();
    await owner.locator("#invite-person-email").fill(employeeEmail);
    await owner.locator("#invite-person-role").selectOption({ label: "EMPLOYEE" });
    await owner.locator("#invite-person-unit").selectOption({ label: unitName });
    await owner.getByRole("button", { name: "Create invitation" }).click();
    const invitationLink = owner.locator('a[href*="/invite?token="]');
    await expect(invitationLink).toBeVisible();
    const invitationUrl = await invitationLink.getAttribute("href");

    await employee.goto(invitationUrl);
    await employee.locator("#invite-first").fill("Employee");
    await employee.locator("#invite-last").fill("Tester");
    await employee.locator("#invite-password").fill(PASSWORD);
    await employee.locator("#invite-confirm").fill(PASSWORD);
    await employee.getByRole("button", { name: "Accept invitation" }).click();
    await expect(employee).toHaveURL(/\/login$/);
    await signIn(employee, employeeEmail);
    await expect(employee.getByRole("link", { name: "Activity", exact: true })).toHaveCount(0);
    await expect(employee.getByRole("link", { name: "Audit", exact: true })).toHaveCount(0);

    await owner.goto(projectPath);
    await owner.locator("#project-member").selectOption({ label: "Employee Tester" });
    await owner.getByRole("button", { name: "Add member" }).click();
    await expect(owner.getByText("Employee Tester").first()).toBeVisible();

    // Read-only project members should not see controls reserved for managers.
    await employee.goto(projectPath);
    await expect(employee.getByRole("heading", { name: revisedMilestoneName })).toBeVisible();
    await expect(employee.getByRole("button", { name: "Edit milestone" })).toHaveCount(0);
    await expect(employee.getByRole("button", { name: "Add milestone" })).toHaveCount(0);

    await owner.goto("/app/work");
    await owner.getByRole("button", { name: "Create task" }).click();
    await owner.locator("#work-project").selectOption({ label: projectName });
    await owner.locator("#task-title").fill(taskTitle);
    await owner.getByRole("button", { name: "Create task" }).last().click();
    let taskCard = owner.locator("article.workspace-data-item").filter({
      has: owner.getByRole("heading", { name: taskTitle }),
    });
    await expect(taskCard).toBeVisible();
    await taskCard.getByRole("button", { name: "Assignment & review" }).click();
    await taskCard.locator('select[id^="assignee-"]').selectOption({ label: "Employee Tester" });
    await taskCard.getByRole("button", { name: "Assign task" }).click();
    await expect(owner.getByText("Task assigned and employee notified.")).toBeVisible();

    // Files must upload, download and delete as actual browser actions,
    // not only render buttons. Use a tiny PNG with recognized magic bytes.
    await owner.goto("/app/files");
    await owner.locator("#files-project").selectOption({ label: projectName });
    await owner.locator("#files-upload").setInputFiles({
      name: "evidence.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==",
        "base64"
      ),
    });
    await owner.getByRole("button", { name: "Upload file" }).click();
    await expect(owner.getByText("File uploaded.")).toBeVisible();
    const fileEntry = owner.locator("article.workspace-data-item").filter({
      has: owner.getByRole("heading", { name: "evidence.png" }),
    });
    await expect(fileEntry).toBeVisible();

    const downloadPromise = owner.waitForEvent("download");
    await fileEntry.getByRole("link", { name: "Download" }).click();
    const fileDownload = await downloadPromise;
    expect(fileDownload.suggestedFilename()).toBe("evidence.png");

    owner.once("dialog", (dialog) => dialog.accept());
    await fileEntry.getByRole("button", { name: "Delete" }).click();
    await expect(owner.getByText("File deleted.")).toBeVisible();
    await expect(fileEntry).toHaveCount(0);



    await employee.goto("/app/notifications");
    const assignmentNotice = employee.locator("article.workspace-data-item").filter({
      hasText: "New task assigned",
    });
    await expect(assignmentNotice.getByRole("link", { name: "Open related work" })).toBeVisible();
    await assignmentNotice.getByRole("link", { name: "Open related work" }).click();
    await expect(employee).toHaveURL(/\/app\/work\?taskId=[0-9a-f-]+/i);
    await expect(employee.getByRole("heading", { name: taskTitle })).toBeVisible();

    await employee.goto("/app/work");
    await expect(employee.getByRole("button", { name: "Create task" })).toHaveCount(0);
    taskCard = employee.locator("article.workspace-data-item").filter({
      has: employee.getByRole("heading", { name: taskTitle }),
    });
    await expect(taskCard).toBeVisible();
    await taskCard.getByRole("button", { name: "Assignment & review" }).click();
    await expect(taskCard.getByRole("button", { name: "Delete" })).toHaveCount(0);
    await expect(taskCard.getByRole("button", { name: "End assignment" })).toHaveCount(0);
    await expect(taskCard.getByRole("button", { name: "Assign task" })).toHaveCount(0);
    await taskCard.getByRole("button", { name: "Start work" }).click();
    await expect(employee.getByText("Task started.")).toBeVisible();
    await taskCard.locator('textarea[id^="submission-"]').fill("Implemented the requested work and verified acceptance criteria.");
    await taskCard.getByRole("button", { name: "Submit for review" }).click();
    await expect(employee.getByText("Work submitted for review.")).toBeVisible();

    await owner.goto("/app/work");
    taskCard = owner.locator("article.workspace-data-item").filter({
      has: owner.getByRole("heading", { name: taskTitle }),
    });
    await taskCard.getByRole("button", { name: "Assignment & review" }).click();
    await taskCard.getByRole("button", { name: "Record review decision" }).click();
    await expect(owner.getByText("Task approved and completed.")).toBeVisible();
    await expect(taskCard.getByText("Status: COMPLETED")).toBeVisible();

    await employee.goto("/app/notifications");
    await expect(employee.getByText("Task approved and completed").first()).toBeVisible();

    // Request recipient selection, delivery, deep-link and resolution are
    // real Owner/Employee operations, even without /users directory access.
    await employee.goto("/app/updates");
    await employee.getByRole("button", { name: "New request" }).click();
    const requestTitle = `Approve project access ${id}`;
    await employee.locator("#request-assignee").selectOption({ label: "Owner Tester" });
    await employee.locator("#request-title").fill(requestTitle);
    await employee.getByRole("button", { name: "Create request" }).click();
    await expect(employee.getByText("Request created.")).toBeVisible();

    await owner.goto("/app/notifications");
    const requestNotice = owner.locator("article.workspace-data-item").filter({
      hasText: "New operational request",
    });
    await expect(requestNotice.getByRole("link", { name: "Open related work" })).toBeVisible();
    await requestNotice.getByRole("link", { name: "Open related work" }).click();
    await expect(owner).toHaveURL(/\/app\/updates\?requestId=[0-9a-f-]+/i);
    const linkedRequest = owner.locator("article.workspace-data-item").filter({
      has: owner.getByRole("heading", { name: requestTitle }),
    });
    await expect(linkedRequest).toBeVisible();
    await linkedRequest.getByRole("button", { name: "Resolve" }).click();
    await expect(linkedRequest.getByText("Status: RESOLVED")).toBeVisible();

    await employee.goto("/app/notifications");
    await expect(employee.getByText("Your request was updated").first()).toBeVisible();

    // Discussions must create real threads and persist replies between distinct user sessions.
    await owner.goto("/app/discussions");
    await owner.getByRole("button", { name: "Start discussion" }).first().click();
    const discussionTitle = `Weekly delivery decision ${id}`;
    await owner.locator("#discussion-title").fill(discussionTitle);
    await owner.getByRole("button", { name: "Start discussion" }).last().click();
    await expect(owner.getByText("Discussion started.")).toBeVisible();
    const discussionCard = owner.locator("article.workspace-data-item").filter({
      has: owner.getByRole("heading", { name: discussionTitle })
    });
    await expect(discussionCard.getByRole("button", { name: "Close replies" })).toBeVisible();
    const discussionElementId = await discussionCard.getAttribute("id");
    expect(discussionElementId).toMatch(/^discussion-[0-9a-f-]+$/i);
    const discussionId = discussionElementId.replace("discussion-", "");
    const discussionLink = "/app/discussions?discussionId=" + discussionId;
    const ownerReply = `Owner approved the release checklist ${id}`;
    await owner.locator("#discussion-comment").fill(ownerReply);
    await owner.getByRole("button", { name: "Post reply" }).click();
    await expect(discussionCard.getByText(ownerReply)).toBeVisible();

    // Deep links must open a thread and show persisted replies across accounts.
    await employee.goto(discussionLink);
    const employeeThread = employee.locator("article.workspace-data-item").filter({
      has: employee.getByRole("heading", { name: discussionTitle })
    });
    await expect(employeeThread.getByRole("button", { name: "Close replies" })).toBeVisible();
    await expect(employeeThread.getByText(ownerReply)).toBeVisible();
    const employeeReply = `Employee confirmed completion ${id}`;
    await employee.locator("#discussion-comment").fill(employeeReply);
    await employee.getByRole("button", { name: "Post reply" }).click();
    await expect(employeeThread.getByText(employeeReply)).toBeVisible();

    await owner.goto(discussionLink);
    await expect(owner.getByText(employeeReply)).toBeVisible();

    // Operational activity is distinct from permission-restricted audit history.
    await owner.goto("/app/activity");
    await expect(owner.getByRole("heading", { name: "Recent company activity" })).toBeVisible();
    await expect(owner.locator("article.workspace-data-item").first()).toBeVisible();
    await owner.goto("/app/audit");
    await expect(owner.getByRole("heading", { name: "Formal audit events" })).toBeVisible();
    await expect(owner.locator("article.workspace-data-item").first()).toBeVisible();

    await employee.goto("/app/audit");
    await expect(employee.getByRole("alert")).toContainText("You do not have permission to view audit records.");

    // Role-specific browser access: real invitations + scoped project leads.
    await inviteAndJoin(owner, manager, {
      email: `manager-${id}@manageos.test`,
      firstName: "Manager",
      role: "MANAGER",
    });
    await inviteAndJoin(owner, lead, {
      email: `lead-${id}@manageos.test`,
      firstName: "Lead",
      role: "TEAM_LEAD",
      unitName,
    });

    await owner.goto(projectPath);
    await owner.locator("#project-lead").selectOption({ label: "Manager Tester" });
    await owner.getByRole("button", { name: "Assign lead" }).click();
    await expect(owner.getByText("Manager Tester").first()).toBeVisible();
    await owner.locator("#project-lead").selectOption({ label: "Lead Tester" });
    await owner.getByRole("button", { name: "Assign lead" }).click();
    await expect(owner.getByText("Lead Tester").first()).toBeVisible();

    await manager.goto(projectPath);
    await expect(manager.getByRole("heading", { name: projectName })).toBeVisible();
    await manager.goto("/app/work");
    await expect(manager.getByRole("heading", { name: taskTitle })).toBeVisible();
    await expect(manager.getByRole("button", { name: "Create task" })).toBeVisible();

    await lead.goto(projectPath);
    await expect(lead.getByRole("heading", { name: projectName })).toBeVisible();
    await lead.goto("/app/work");
    await expect(lead.getByRole("heading", { name: taskTitle })).toBeVisible();

    await manager.getByRole("button", { name: "Sign out" }).click();
    await expect(manager).toHaveURL(/\/login$/);
    await lead.getByRole("button", { name: "Sign out" }).click();
    await expect(lead).toHaveURL(/\/login$/);

    await owner.getByRole("button", { name: "Sign out" }).click();
    await expect(owner).toHaveURL(/\/login$/);
    await owner.goto("/app/work");
    await expect(owner).toHaveURL(/\/login$/);
  } finally {
    await ownerContext.close();
    await employeeContext.close();
    await managerContext.close();
    await leadContext.close();
  }
});

test("mobile form is navigable without horizontal page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/register");
  await expect(page.locator("#companyName")).toBeVisible();
  await expect(page.getByRole("button", { name: /Create ManageOS account/ })).toBeVisible();
  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport + 4);
});

test("password recovery forms validate credentials and show service failures", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: "Forgot your password?" })).toBeVisible();
  await page.locator("#forgot-email").fill("123456");
  await page.getByRole("button", { name: /Send reset instructions/ }).click();
  await expect(page.getByRole("alert").getByText("Enter a valid email address.")).toBeVisible();

  await page.locator("#forgot-email").fill("unknown@manageos.test");
  await page.getByRole("button", { name: /Send reset instructions/ }).click();
  await expect(page.getByRole("alert").getByText(/temporarily unavailable/i)).toBeVisible();

  await page.goto("/reset-password?token=" + "f".repeat(64));
  await page.locator("#new-password").fill("short");
  await page.locator("#confirm-new-password").fill("short");
  await page.getByRole("button", { name: /Save new password/ }).click();
  await expect(page.getByRole("alert").getByText(/between 12 and 128/i)).toBeVisible();

  await page.locator("#new-password").fill("valid-password-length-2026");
  await page.locator("#confirm-new-password").fill("does-not-match-password");
  await page.getByRole("button", { name: /Save new password/ }).click();
  await expect(page.getByRole("alert").getByText(/Passwords do not match/i)).toBeVisible();

  await page.goto("/reset-password");
  await expect(page.getByText(/Open a valid reset link from your email/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Save new password/ })).toBeDisabled();
});

test("authenticated workspace is usable at 390px mobile width", async ({ page }) => {
  test.setTimeout(180_000);
  const id = Date.now().toString(36);
  const email = "mobile-" + id + "@manageos.test";
  await page.goto("/register");
  await page.locator("#companyName").fill("Mobile Workspace " + id);
  await page.locator("#firstName").fill("Mobile");
  await page.locator("#lastName").fill("Tester");
  await page.locator("#register-email").fill(email);
  await page.locator("#register-password").fill(PASSWORD);
  await page.locator("#confirm-password").fill(PASSWORD);
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole("button", { name: /Create ManageOS account/ }).click();
  await expect(page).toHaveURL(/\/login$/);
  await signIn(page, email);
  await page.setViewportSize({ width: 390, height: 844 });

  const routes = [
    "overview", "goals", "organization", "people", "projects",
    "work", "updates", "discussions", "notifications",
    "activity", "audit", "files"
  ];
  for (const route of routes) {
    await page.goto("/app/" + route);
    await expect(page.locator(".app-content h1").first()).toBeVisible();
    const size = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth
    }));
    expect(size.document, route + " overflows mobile viewport").toBeLessThanOrEqual(size.viewport + 4);
  }
  await page.getByRole("link", { name: "Projects", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/projects$/);
});
