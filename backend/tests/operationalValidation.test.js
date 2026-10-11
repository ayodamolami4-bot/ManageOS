const test = require("node:test");
const assert = require("node:assert/strict");
const {
  blockerBody, requestBody, requestStatusBody, blockerParams,
} = require("../src/validators/operationalSchemas");
const id = "613ac7e3-4770-44cc-bdd3-0470879607d0";

test("blocker requires title and caps description", () => {
  assert.equal(blockerBody.safeParse({ title: "No access", description: null }).success, true);
  assert.equal(blockerBody.safeParse({ title: "   " }).success, false);
  assert.equal(blockerBody.safeParse({ title: "No access", description: "x".repeat(10001) }).success, false);
  assert.equal(blockerBody.safeParse({ title: "No access", status: "RESOLVED" }).success, false);
  assert.equal(blockerParams.safeParse({ blockerId: "abc" }).success, false);
});

test("request validates assignee, type, title and unknown fields", () => {
  assert.equal(requestBody.safeParse({ assignedTo: id, type: "HELP", title: "Help needed" }).success, true);
  assert.equal(requestBody.safeParse({ assignedTo: "not-valid", type: "HELP", title: "Help needed" }).success, false);
  assert.equal(requestBody.safeParse({ type: "SUPPORT", title: "Help needed" }).success, false);
  assert.equal(requestBody.safeParse({ type: "HELP", title: "  " }).success, false);
  assert.equal(requestBody.safeParse({ type: "HELP", title: "Help needed", companyId: id }).success, false);
});

test("request status only accepts actionable transitions", () => {
  assert.equal(requestStatusBody.safeParse({ status: "IN_PROGRESS" }).success, true);
  assert.equal(requestStatusBody.safeParse({ status: "OPEN" }).success, false);
  assert.equal(requestStatusBody.safeParse({ status: "APPROVED" }).success, false);
});
