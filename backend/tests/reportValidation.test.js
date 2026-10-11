const test = require("node:test");
const assert = require("node:assert/strict");
const { reportBodySchema, taskIdParamsSchema } = require("../src/validators/reportSchemas");

test("reports require a nonempty update and whole-number progress", () => {
  assert.equal(reportBodySchema.safeParse({ progressPercentage: 75, content: "Done" }).success, true);
  for (const progressPercentage of [-1, 101, 2.3, "50"]) {
    assert.equal(reportBodySchema.safeParse({ progressPercentage, content: "Done" }).success, false);
  }
  assert.equal(reportBodySchema.safeParse({ progressPercentage: 50, content: " " }).success, false);
  assert.equal(reportBodySchema.safeParse({ progressPercentage: 50, content: "Done", canApprove: true }).success, false);
});

test("task report path must be a UUID", () => {
  assert.equal(taskIdParamsSchema.safeParse({ taskId: "1234" }).success, false);
});
