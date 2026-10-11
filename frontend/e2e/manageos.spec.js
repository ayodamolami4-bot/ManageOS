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
    await owner.goto(projectPath);

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

    await owner.goto(projectPath);
    await owner.locator("#project-member").selectOption({ label: "Employee Tester" });
    await owner.getByRole("button", { name: "Add member" }).click();
    await expect(owner.getByText("Employee Tester").first()).toBeVisible();

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
    taskCard = employee.locator("article.workspace-data-item").filter({
      has: employee.getByRole("heading", { name: taskTitle }),
    });
    await expect(taskCard).toBeVisible();
    await taskCard.getByRole("button", { name: "Assignment & review" }).click();
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
