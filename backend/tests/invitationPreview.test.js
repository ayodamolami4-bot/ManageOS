const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const repository = require("../src/repositories/invitationRepository");
const { previewUserInvitation } = require("../src/services/invitationService");
const { previewInvitationSchema } = require("../src/validators/invitationSchemas");
const app = require("../src/app");

const TOKEN = "a".repeat(64);
const active = {
  status: "PENDING",
  expires_at: new Date(Date.now() + 86400000).toISOString(),
  company_name: "Lagoon Courier",
  role_name: "EMPLOYEE",
  organization_unit_name: "Dispatch"
};

test("invitation preview validates a strict token and blocks bad input before database access", async () => {
  assert.equal(previewInvitationSchema.safeParse({ token: TOKEN }).success, true);
  assert.equal(previewInvitationSchema.safeParse({ token: "oops" }).success, false);
  assert.equal(previewInvitationSchema.safeParse({ token: TOKEN, roleId: "OWNER" }).success, false);
  await assert.rejects(previewUserInvitation("guess"), { message: "INVITATION_NOT_FOUND" });
});

test("preview response contains only safe verified metadata, not credentials or addresses", async (t) => {
  const original = repository.getInvitationPreviewByTokenHash;
  let called = 0;
  repository.getInvitationPreviewByTokenHash = async (hash) => {
    called++;
    assert.match(hash, /^[0-9a-f]{64}$/);
    assert.notEqual(hash, TOKEN);
    return { ...active, email: "private@example.com", password_hash: "not-for-the-client" };
  };
  t.after(() => { repository.getInvitationPreviewByTokenHash = original; });
  const result = await previewUserInvitation(TOKEN);
  assert.deepEqual(result, {
    companyName: "Lagoon Courier",
    roleName: "EMPLOYEE",
    organizationUnitName: "Dispatch",
    expiresAt: active.expires_at
  });
  assert.equal(called, 1);
});

test("preview rejects consumed, missing, revoked and expired invitations", async (t) => {
  const original = repository.getInvitationPreviewByTokenHash;
  t.after(() => { repository.getInvitationPreviewByTokenHash = original; });
  repository.getInvitationPreviewByTokenHash = async () => null;
  await assert.rejects(previewUserInvitation(TOKEN), { message: "INVITATION_NOT_FOUND" });
  repository.getInvitationPreviewByTokenHash = async () => ({ ...active, status: "ACCEPTED" });
  await assert.rejects(previewUserInvitation(TOKEN), { message: "INVITATION_NOT_ACTIVE" });
  repository.getInvitationPreviewByTokenHash = async () => ({ ...active, status: "REVOKED" });
  await assert.rejects(previewUserInvitation(TOKEN), { message: "INVITATION_NOT_ACTIVE" });
  repository.getInvitationPreviewByTokenHash = async () => ({ ...active, expires_at: new Date(Date.now() - 1000).toISOString() });
  await assert.rejects(previewUserInvitation(TOKEN), { message: "INVITATION_EXPIRED" });
});

test("public preview requires CSRF and returns only its bounded safe payload", async (t) => {
  const original = repository.getInvitationPreviewByTokenHash;
  repository.getInvitationPreviewByTokenHash = async () => active;
  t.after(() => { repository.getInvitationPreviewByTokenHash = original; });
  const csrf = await request(app).get("/api/auth/csrf");
  assert.equal(csrf.status, 200);
  const header = csrf.body.data.csrfToken;
  const cookie = csrf.headers["set-cookie"].map(item => item.split(";")[0]).join("; ");
  const missing = await request(app).post("/api/invitations/preview").send({ token: TOKEN });
  assert.equal(missing.status, 403);
  const valid = await request(app).post("/api/invitations/preview")
    .set("Cookie", cookie).set("X-CSRF-Token", header).send({ token: TOKEN });
  assert.equal(valid.status, 200);
  assert.equal(valid.headers["cache-control"], "no-store");
  assert.deepEqual(valid.body.data, {
    companyName: active.company_name,
    roleName: active.role_name,
    organizationUnitName: active.organization_unit_name,
    expiresAt: active.expires_at
  });
  assert.equal(valid.headers["set-cookie"]?.some(item => item.startsWith("session_id=")) || false, false);
});
