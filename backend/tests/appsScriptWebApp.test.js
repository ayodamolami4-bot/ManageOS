const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");

const source = fs.readFileSync(
  path.join(__dirname, "../../integrations/apps-script/ManageOSMailer.gs"),
  "utf8"
);
const secret = "script_only_test_secret_abcdefghijklmnopqrstuvwxyz_0123456789";
const payload = {
  secret,
  to: "employee@example.com",
  subject: "ManageOS invitation",
  text: "Join Example. https://manageos.onrender.com/invite?token=abc",
  idempotencyKey: "manageos-invitation-123"
};

function harness({ quota = 100, mailThrows = false } = {}) {
  const map = new Map([["MANAGEOS_MAIL_SECRET", secret]]);
  const messages = [];
  const props = {
    getProperty: (key) => map.get(key) ?? null,
    setProperty: (key, value) => { map.set(key, value); },
    deleteProperty: (key) => { map.delete(key); },
    getProperties: () => Object.fromEntries(map)
  };
  const out = content => ({
    content,
    setMimeType() { return this; }
  });
  const sandbox = {
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: out
    },
    PropertiesService: { getScriptProperties: () => props },
    MailApp: {
      getRemainingDailyQuota: () => quota,
      sendEmail: message => {
        if (mailThrows) throw new Error("Provider failed with sensitive details");
        messages.push(message);
      }
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => true,
        releaseLock: () => {}
      })
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: "SHA_256" },
      Charset: { UTF_8: "UTF_8" },
      computeDigest: (_alg, input) =>
        [...crypto.createHash("sha256").update(input).digest()]
    },
    console: { error: () => {} }
  };
  vm.runInNewContext(source, sandbox);
  const send = value => JSON.parse(sandbox.doPost({
    postData: { contents: JSON.stringify(value) }
  }).content);
  return { send, messages, get: () => map, sandbox };
}

test("only callers with the server-side shared secret can send email", () => {
  const h = harness();
  assert.equal(h.send({ ...payload, secret: "wrong" }).ok, false);
  assert.equal(h.send({ ...payload, to: "injected@example.com\nBcc:bad@evil.com" }).ok, false);
  assert.equal(h.sandbox.doGet().content, '{"ok":false}');
  assert.equal(h.messages.length, 0);
});

test("authorized Apps Script sends once and suppresses identical invitation retries", () => {
  const h = harness();
  assert.equal(h.send(payload).ok, true);
  assert.equal(h.send(payload).ok, true);
  assert.equal(h.messages.length, 1);
  assert.equal(h.messages[0].to, payload.to);
  assert.equal(h.messages[0].subject, payload.subject);
  assert.equal(h.messages[0].name, "ManageOS");
  assert.equal(h.messages[0].body, payload.text);
  assert.ok([...h.get().keys()].some(x => x.startsWith("SENT_")));
});

test("quota failures and provider failures never claim delivery", () => {
  const noQuota = harness({ quota: 0 });
  assert.equal(noQuota.send(payload).ok, false);
  assert.equal(noQuota.messages.length, 0);
  const failed = harness({ mailThrows: true });
  assert.equal(failed.send(payload).ok, false);
  assert.equal(failed.messages.length, 0);
});
