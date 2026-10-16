const test = require("node:test");
const assert = require("node:assert/strict");
const { readEmailConfig, emailConfigured } = require("../src/config/emailConfig");
const { buildRawMessage, sendGmailEmail } = require("../src/services/gmailApiService");

const env = {
  NODE_ENV: "production",
  PUBLIC_APP_URL: "https://manageos.onrender.com",
  EMAIL_PROVIDER: "gmail",
  GMAIL_SENDER_EMAIL: "sender@gmail.com",
  GMAIL_OAUTH_CLIENT_ID: "client.apps.googleusercontent.com",
  GMAIL_OAUTH_CLIENT_SECRET: "secret",
  GMAIL_OAUTH_REFRESH_TOKEN: "refresh-opaque-token"
};

test("Gmail sender stays disabled without all private OAuth credentials", () => {
  assert.equal(emailConfigured({ ...env, GMAIL_OAUTH_REFRESH_TOKEN: "" }), false);
  assert.equal(emailConfigured({ ...env, GMAIL_SENDER_EMAIL: "injected\r\nBcc: a@b.com" }), false);
  assert.equal(readEmailConfig(env).provider, "gmail");
  assert.equal(emailConfigured({ ...env, PUBLIC_APP_URL: "http://manageos.onrender.com" }), false);
});

test("Gmail send uses OAuth refresh and sends RFC-compatible UTF-8 MIME via HTTPS", async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push([url, options]);
    if (url === "https://oauth2.googleapis.com/token") {
      const p = new URLSearchParams(options.body);
      assert.equal(options.method, "POST");
      assert.equal(p.get("grant_type"), "refresh_token");
      assert.equal(p.get("client_id"), env.GMAIL_OAUTH_CLIENT_ID);
      assert.equal(p.get("refresh_token"), env.GMAIL_OAUTH_REFRESH_TOKEN);
      return { ok: true, json: async () => ({ access_token: "access-for-test" }) };
    }
    assert.equal(url, "https://gmail.googleapis.com/gmail/v1/users/me/messages/send");
    assert.equal(options.headers.Authorization, "Bearer access-for-test");
    const msg = JSON.parse(options.body);
    const raw = Buffer.from(msg.raw, "base64url").toString("utf8");
    assert.match(raw, /From: ManageOS <sender@gmail.com>/);
    assert.match(raw, /To: recipient@example.com/);
    assert.match(raw, /MIME-Version: 1.0/);
    assert.match(raw, /Content-Transfer-Encoding: base64/);
    const text = Buffer.from(raw.split("\r\n\r\n")[1].replace(/\s/g, ""), "base64").toString("utf8");
    assert.match(text, /https:\/\/manageos\.onrender\.com\/invite\?token=/);
    assert.match(text, /EMPLOYEE/);
    assert.match(text, /Operations/);
    assert.doesNotMatch(raw, /refresh-opaque-token|client.apps.googleusercontent/);
    return { ok: true };
  };
  await sendGmailEmail({
    config: readEmailConfig(env),
    to: "recipient@example.com",
    subject: "You're invited to join Lagos Logistics",
    text: "Accept at https://manageos.onrender.com/invite?token=abc.\nRole: EMPLOYEE.\nDepartment: Operations.",
    fetchImpl
  });
  assert.equal(requests.length, 2);
});

test("Gmail never sends when OAuth refresh fails or sender header is invalid", async () => {
  let calls = 0;
  const broken = async () => { calls++; return { ok: false, status: 400 }; };
  await assert.rejects(
    sendGmailEmail({ config: readEmailConfig(env), to: "recipient@example.com",
      subject: "Invitation", text: "test", fetchImpl: broken }),
    { message: "EMAIL_DELIVERY_FAILED" }
  );
  assert.equal(calls, 1);
  assert.throws(() => buildRawMessage({
    sender: "sender@gmail.com", to: "recipient@example.com\r\nBcc: attacker@example.com",
    subject: "Subject", text: "Hello"
  }), { message: "EMAIL_ADDRESS_INVALID" });
});

test("Gmail provider is opt-in and does not silently fall back to Resend", () => {
  assert.equal(emailConfigured({
    EMAIL_PROVIDER: "gmail", PUBLIC_APP_URL: env.PUBLIC_APP_URL,
    RESEND_API_KEY: "re_dummy_value", RESEND_FROM_EMAIL: "hello@example.com"
  }), false);
});
