import test from "node:test";
import assert from "node:assert/strict";
import { invitationFeedback } from "./invitationFeedback.js";

test("development invitation shares the test link", () => {
  assert.match(invitationFeedback({ data: { token: "test-only-token" } }), /development-only link/);
});

test("successful production invitation confirms email delivery", () => {
  const result = invitationFeedback({ data: { id: "invitation-id" } });
  assert.match(result, /Invitation email sent/);
  assert.doesNotMatch(result, /not configured/i);
});
