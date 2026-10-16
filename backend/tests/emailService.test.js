const test = require("node:test");
const assert = require("node:assert/strict");
const email = require("../src/services/emailService");

const managed = ["RESEND_API_KEY", "RESEND_FROM_EMAIL", "PUBLIC_APP_URL", "NODE_ENV"];
function setUp(t, replacements, fetchImpl) {
  const original = Object.fromEntries(managed.map(name => [name, process.env[name]]));
  const beforeFetch = global.fetch;
  t.after(() => {
    for (const name of managed) {
      if (original[name] === undefined) delete process.env[name];
      else process.env[name] = original[name];
    }
    global.fetch = beforeFetch;
  });
  for (const name of managed) delete process.env[name];
  Object.assign(process.env, {
    NODE_ENV: "production",
    RESEND_API_KEY: "re_mock_test_key",
    RESEND_FROM_EMAIL: "ManageOS <no-reply@example.com>",
    PUBLIC_APP_URL: "https://manageos.onrender.com",
    ...replacements,
  });
  if (fetchImpl) global.fetch = fetchImpl;
}

test("production email remains disabled without verified sender configuration", (t) => {
  setUp(t, { RESEND_FROM_EMAIL: "" });
  assert.equal(email.configured(), false);
});

test("password reset sends only to the account and links back to the secure app", async (t) => {
  let calls = 0;
  setUp(t, {}, async (url, options) => {
    calls++;
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(options.headers.Authorization, "Bearer re_mock_test_key");
    const body = JSON.parse(options.body);
    assert.deepEqual(body.to, ["tester@example.com"]);
    assert.equal(body.from, "ManageOS <no-reply@example.com>");
    assert.equal(body.subject, "Reset your ManageOS password");
    assert.match(body.text, /https:\/\/manageos\.onrender\.com\/reset-password\?token=/);
    assert.match(body.text, /abc123/);
    assert.doesNotMatch(JSON.stringify(body), /password_hash|DATABASE_URL|SUPABASE/);
    return { ok: true, status: 200 };
  });
  assert.equal(email.configured(), true);
  await email.sendPasswordResetEmail({ to: "tester@example.com", token: "abc123" });
  assert.equal(calls, 1);
});

test("invitation uses provider idempotency and never changes user roles", async (t) => {
  setUp(t, {}, async (_url, options) => {
    assert.equal(options.headers["Idempotency-Key"], "manageos-invitation-123");
    const body = JSON.parse(options.body);
    assert.deepEqual(body.to, ["staff@example.com"]);
    assert.match(body.text, /\/invite\?token=invitation123/);
    assert.match(body.subject, /Tidepath/);
    assert.doesNotMatch(JSON.stringify(body), /password_hash/);
    return { ok: true };
  });
  await email.sendInvitationEmail({
    to: "staff@example.com",
    token: "invitation123",
    companyName: "Tidepath",
    invitationId: "123",
  });
});

test("rejects non-HTTPS public password recovery origin in production", async (t) => {
  let calls = 0;
  setUp(t, { PUBLIC_APP_URL: "http://manageos.onrender.com" }, async () => {
    calls++;
    return { ok: true };
  });
  await assert.rejects(email.sendPasswordResetEmail({ to: "a@example.com", token: "abc" }),
    /EMAIL_PUBLIC_URL_INSECURE/);
  assert.equal(calls, 0);
});

test("provider failure is surfaced without logging or returning provider response", async (t) => {
  setUp(t, {}, async () => ({ ok: false, status: 403, text: async () => "sensitive-provider-detail" }));
  await assert.rejects(email.sendInvitationEmail({
    to: "a@example.com", token: "abc", companyName: "Example", invitationId: "id",
  }), error => {
    assert.equal(error.message, "EMAIL_DELIVERY_FAILED");
    return true;
  });
});
