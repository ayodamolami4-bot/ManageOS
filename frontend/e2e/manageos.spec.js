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
  test.setTimeout(180_000);
  const ownerContext = await browser.newContext();
  const employeeContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  const employee = await employeeContext.newPage();
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

    await owner.getByRole("button", { name: "Sign out" }).click();
    await expect(owner).toHaveURL(/\/login$/);
    await owner.goto("/app/work");
    await expect(owner).toHaveURL(/\/login$/);
  } finally {
    await ownerContext.close();
    await employeeContext.close();
  }
});
