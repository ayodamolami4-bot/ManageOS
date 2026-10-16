const test = require("node:test");
const assert = require("node:assert/strict");
const { verifyCompanyRegistrationSchema } =
  require("../src/validators/companyVerificationSchemas");
const {
  validToken, hashToken, VERIFICATION_HOURS, RETRY_MINUTES
} = require("../src/services/companyRegistrationService");

test("company activation tokens must be exactly 64 hex characters", () => {
  assert.equal(validToken("a".repeat(64)), true);
  assert.equal(validToken("A".repeat(64)), true);
  assert.equal(validToken("a".repeat(63)), false);
  assert.equal(validToken("!"+ "a".repeat(63)), false);
  assert.equal(verifyCompanyRegistrationSchema.safeParse({ token: "a".repeat(64) }).success, true);
  assert.equal(verifyCompanyRegistrationSchema.safeParse({ token: "invalid" }).success, false);
  assert.equal(verifyCompanyRegistrationSchema.safeParse({
    token: "a".repeat(64), role: "OWNER"
  }).success, false);
});

test("raw token is never the stored SHA-256 digest", () => {
  const token = "b".repeat(64);
  assert.notEqual(hashToken(token), token);
  assert.match(hashToken(token), /^[a-f0-9]{64}$/);
});

test("verification links expire and failed resend requests are throttled", () => {
  assert.equal(VERIFICATION_HOURS, 24);
  assert.ok(RETRY_MINUTES >= 1);
});
