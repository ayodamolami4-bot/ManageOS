const test = require("node:test");
const assert = require("node:assert/strict");
const { readEmailConfig, emailConfigured } = require("../src/config/emailConfig");
const { sendAppsScriptEmail } = require("../src/services/appsScriptEmailService");

const setup = {
  NODE_ENV: "production",
  EMAIL_PROVIDER: "apps_script",
  PUBLIC_APP_URL: "https://manageos.onrender.com",
  APPS_SCRIPT_WEB_APP_URL: "https://script.google.com/macros/s/AKfycb_testdeployment/exec",
  APPS_SCRIPT_SHARED_SECRET: "random_base64url_server_only_shared_secret_abcdefghijklmnopqrstuvwxyz"
};

test("Apps Script sender is disabled until endpoint, long secret and origin are present", () => {
  assert.equal(emailConfigured({ ...setup, APPS_SCRIPT_SHARED_SECRET: "" }), false);
  assert.equal(emailConfigured({ ...setup, APPS_SCRIPT_WEB_APP_URL: "" }), false);
  assert.equal(emailConfigured({ ...setup, PUBLIC_APP_URL: "" }), false);
  assert.equal(emailConfigured(setup), true);
});

test("Apps Script URL cannot be redirected to arbitrary external hosts or querystrings", () => {
  assert.equal(emailConfigured({
    ...setup, APPS_SCRIPT_WEB_APP_URL: "https://evil.example.com/relay"
  }), false);
  assert.equal(emailConfigured({
    ...setup, APPS_SCRIPT_WEB_APP_URL: setup.APPS_SCRIPT_WEB_APP_URL + "?key=leak"
  }), false);
  assert.equal(emailConfigured({
    ...setup, APPS_SCRIPT_WEB_APP_URL: "http://script.google.com/macros/s/test/exec"
  }), false);
  assert.equal(emailConfigured({ ...setup, APPS_SCRIPT_SHARED_SECRET: "short" }), false);
});

test("Apps Script sends plain text invitation via authorized HTTPS endpoint", async () => {
  let called = false;
  await sendAppsScriptEmail({
    config: readEmailConfig(setup),
    to: "employee@example.com",
    subject: "Invitation to Example",
    text: "Company: Example\nRole: EMPLOYEE\nhttps://manageos.onrender.com/invite?token=TESTTOKEN",
    idempotencyKey: "manageos-invitation-123",
    fetchImpl: async (url, options) => {
      called = true;
      assert.equal(url, setup.APPS_SCRIPT_WEB_APP_URL);
      assert.equal(options.method, "POST");
      assert.equal(options.redirect, "follow");
      const body = JSON.parse(options.body);
      assert.equal(body.secret, setup.APPS_SCRIPT_SHARED_SECRET);
      assert.equal(body.to, "employee@example.com");
      assert.equal(body.idempotencyKey, "manageos-invitation-123");
      assert.match(body.text, /invite\?token=TESTTOKEN/);
      assert.doesNotMatch(url, /TESTTOKEN|server_only_shared_secret/);
      return { ok: true, json: async () => ({ ok: true }) };
    }
  });
  assert.equal(called, true);
});

test("HTTP 200 is not treated as sent if Google script reports failure", async () => {
  await assert.rejects(sendAppsScriptEmail({
    config: readEmailConfig(setup),
    to: "employee@example.com", subject: "Invitation",
    text: "hello",
    fetchImpl: async () => ({ ok: true, json: async () => ({ ok: false }) })
  }), { message: "EMAIL_DELIVERY_FAILED" });
});

test("Apps Script rejects Google login HTML and failed HTTP statuses", async () => {
  for (const simulated of [
    { ok: true, json: async () => { throw new Error("Google HTML login"); } },
    { ok: false, status: 403 }
  ]) {
    await assert.rejects(sendAppsScriptEmail({
      config: readEmailConfig(setup),
      to: "employee@example.com", subject: "Invitation",
      text: "hello",
      fetchImpl: async () => simulated
    }), { message: "EMAIL_DELIVERY_FAILED" });
  }
});

test("refuse injection and malformed recipient before any network request", async () => {
  let calls = 0;
  await assert.rejects(sendAppsScriptEmail({
    config: readEmailConfig(setup),
    to: "employee@example.com\r\nBcc: attacker@example.com",
    subject: "Invitation", text: "hello",
    fetchImpl: async () => { calls++; return { ok: true }; }
  }), { message: "EMAIL_ADDRESS_INVALID" });
  assert.equal(calls, 0);
});
