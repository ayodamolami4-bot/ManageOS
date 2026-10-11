const test = require("node:test");
const assert = require("node:assert/strict");
const {
  taskParams, assignmentBody, submissionBody, reviewBody,
} = require("../src/validators/taskOperationsSchemas");

const userId = "613ac7e3-4770-44cc-bdd3-0470879607d0";
test("assignments require user UUID and valid effort values", () => {
  assert.equal(assignmentBody.safeParse({ userId, estimatedEffortHours: 4.25 }).success, true);
  for (const estimatedEffortHours of [-1, 10000, 1.234, "5"]) {
    assert.equal(assignmentBody.safeParse({ userId, estimatedEffortHours }).success, false);
  }
  assert.equal(assignmentBody.safeParse({ userId: "not-a-uuid" }).success, false);
  assert.equal(assignmentBody.safeParse({ userId, role: "OWNER" }).success, false);
  assert.equal(taskParams.safeParse({ taskId: "oops" }).success, false);
});

test("submission must contain meaningful text", () => {
  assert.equal(submissionBody.safeParse({ description: "Finished integration tests" }).success, true);
  assert.equal(submissionBody.safeParse({ description: "  " }).success, false);
  assert.equal(submissionBody.safeParse({ description: "x".repeat(10001) }).success, false);
});

test("reviews require a valid decision and useful feedback when rejecting", () => {
  assert.equal(reviewBody.safeParse({ decision: "APPROVED", comment: null }).success, true);
  assert.equal(reviewBody.safeParse({ decision: "NEEDS_CHANGES", comment: "Fix the failing test" }).success, true);
  assert.equal(reviewBody.safeParse({ decision: "NEEDS_CHANGES", comment: " " }).success, false);
  assert.equal(reviewBody.safeParse({ decision: "PENDING" }).success, false);
});
