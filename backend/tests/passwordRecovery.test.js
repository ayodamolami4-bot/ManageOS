const test = require("node:test");
const assert = require("node:assert/strict");
const {
  hashResetToken, generateResetToken, TOKEN_TTL_MINUTES, REQUEST_COOLDOWN_MINUTES,
} = require("../src/services/passwordRecoveryService");
const {
  forgotPasswordSchema, resetPasswordSchema,
} = require("../src/validators/passwordRecoverySchemas");

test("recovery tokens use cryptographic randomness and only hashed digests", () => {
  const a = generateResetToken();
  const b = generateResetToken();
  assert.match(a, /^[a-f0-9]{64}$/);
  assert.notEqual(a, b);
  assert.equal(hashResetToken(a).length, 64);
  assert.notEqual(hashResetToken(a), a);
  assert.notEqual(hashResetToken(a), hashResetToken(b));
  assert.equal(TOKEN_TTL_MINUTES, 30);
  assert.equal(REQUEST_COOLDOWN_MINUTES, 5);
});

test("forgot-password validates normalized account email", () => {
  assert.equal(forgotPasswordSchema.parse({ email: " TEST@Example.com " }).email, "test@example.com");
  assert.equal(forgotPasswordSchema.safeParse({ email: "not-an-email" }).success, false);
  assert.equal(forgotPasswordSchema.safeParse({ email: "a@b.com", companyId: "x" }).success, false);
});

test("reset requires full credential, new password policy and no extra fields", () => {
  const token = generateResetToken();
  assert.equal(resetPasswordSchema.safeParse({ token, password: "long-password-2026" }).success, true);
  assert.equal(resetPasswordSchema.safeParse({ token, password: "short" }).success, false);
  assert.equal(resetPasswordSchema.safeParse({ token: "guess", password: "long-password-2026" }).success, false);
  assert.equal(resetPasswordSchema.safeParse({ token, password: "long-password-2026", userId: "guess" }).success, false);
});
