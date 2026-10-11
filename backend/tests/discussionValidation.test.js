const test = require("node:test");
const assert = require("node:assert/strict");
const { discussionCreateBody, commentCreateBody } = require("../src/validators/discussionSchemas");
const id = "613ac7e3-4770-44cc-bdd3-0470879607d0";

test("discussion validation rejects invalid resource IDs, types and titles", () => {
  assert.equal(discussionCreateBody.safeParse({ resourceType: "PROJECT", resourceId: id, title: "Launch" }).success, true);
  assert.equal(discussionCreateBody.safeParse({ resourceType: "PRIVATE", resourceId: id, title: "Launch" }).success, false);
  assert.equal(discussionCreateBody.safeParse({ resourceType: "PROJECT", resourceId: "abc", title: "Launch" }).success, false);
  assert.equal(discussionCreateBody.safeParse({ resourceType: "PROJECT", resourceId: id, title: " " }).success, false);
});

test("comments require content within length bound", () => {
  assert.equal(commentCreateBody.safeParse({ content: "Agreed" }).success, true);
  assert.equal(commentCreateBody.safeParse({ content: " " }).success, false);
  assert.equal(commentCreateBody.safeParse({ content: "x".repeat(10001) }).success, false);
});
