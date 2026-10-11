const test = require("node:test");
const assert = require("node:assert/strict");

const { createGoalSchema, updateGoalSchema } = require("../src/validators/goalSchemas");
const { createOrganizationUnitSchema } = require("../src/validators/organizationUnitSchemas");

test("goal requires title and rejects unknown fields", () => {
  assert.equal(createGoalSchema.safeParse({ title: " " }).success, false);
  assert.equal(createGoalSchema.safeParse({ title: "2027 growth", unexpected: true }).success, false);
  assert.equal(createGoalSchema.safeParse({ title: "2027 growth" }).success, true);
});

test("goal rejects invalid dates and inconsistent ranges", () => {
  assert.equal(createGoalSchema.safeParse({ title: "A", startDate: "2026-02-30" }).success, false);
  assert.equal(createGoalSchema.safeParse({
    title: "A", startDate: "2026-11-20", dueDate: "2026-11-01"
  }).success, false);
});

test("goal rejects unsupported status and priority", () => {
  assert.equal(createGoalSchema.safeParse({ title: "A", status: "UNKNOWN" }).success, false);
  assert.equal(createGoalSchema.safeParse({ title: "A", priority: "CRITICAL" }).success, false);
});

test("goal update requires replacement fields", () => {
  assert.equal(updateGoalSchema.safeParse({ title: "A" }).success, false);
  assert.equal(updateGoalSchema.safeParse({
    title: "A", description: null, status: "ACTIVE", priority: "HIGH",
    startDate: null, dueDate: null
  }).success, true);
});

test("organization requires a real unit name and type", () => {
  assert.equal(createOrganizationUnitSchema.safeParse({ name: " ", type: "Branch" }).success, false);
  assert.equal(createOrganizationUnitSchema.safeParse({ name: "West", type: " " }).success, false);
  assert.equal(createOrganizationUnitSchema.safeParse({ name: "West", type: "Branch" }).success, true);
});

test("organization rejects invalid parent IDs and extra fields", () => {
  assert.equal(createOrganizationUnitSchema.safeParse({
    name: "West", type: "Branch", parentUnitId: "wrong"
  }).success, false);
  assert.equal(createOrganizationUnitSchema.safeParse({
    name: "West", type: "Branch", isAdmin: true
  }).success, false);
});
