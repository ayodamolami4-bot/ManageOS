const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const pool = require("../../src/db/database");
const app = require("../../src/app");
const { hashPassword } = require("../../src/utils/password");

const secret = "ManageOS-CI-Password-2026!";

async function newClient() {
  const agent = request.agent(app);
  const result = await agent.get("/api/auth/csrf");
  assert.equal(result.status, 200);
  return {
    agent,
    csrf: result.body.data.csrfToken,
    post(url, body) {
      return agent.post(url).set("X-CSRF-Token", this.csrf).send(body);
    },
    put(url, body) {
      return agent.put(url).set("X-CSRF-Token", this.csrf).send(body);
    },
    get(url) { return agent.get(url); },
    remove(url) { return agent.delete(url).set("X-CSRF-Token", this.csrf); },
  };
}

async function registerAndLogin(client, companyName, email) {
  const registration = await client.post("/api/auth/register/company", {
    companyName, firstName: "Owner", lastName: "Tester",
    email, password: secret,
  });
  assert.equal(registration.status, 202, JSON.stringify(registration.body));
  assert.ok(registration.body.data.testVerificationToken);

  // A registration request must NOT create an Owner or company until email
  // ownership is confirmed; fake or abandoned addresses remain powerless.
  const before = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  assert.equal(before.rows.length, 0);
  const earlyLogin = await client.post("/api/auth/login", { email, password: secret });
  assert.equal(earlyLogin.status, 401);

  const confirmation = await client.post("/api/auth/verify-company", {
    token: registration.body.data.testVerificationToken
  });
  assert.equal(confirmation.status, 201, JSON.stringify(confirmation.body));
  const reused = await client.post("/api/auth/verify-company", {
    token: registration.body.data.testVerificationToken
  });
  assert.equal(reused.status, 400);

  const login = await client.post("/api/auth/login", { email, password: secret });
  assert.equal(login.status, 200, JSON.stringify(login.body));
  return { companyId: confirmation.body.data.company.id, userId: confirmation.body.data.user.id };
}


test("PostgreSQL: verified email change, account takeover prevention and session revocation", {
  skip: process.env.RUN_DB_INTEGRATION !== "1"
}, async () => {
  const account = await newClient();
  const newSession = await newClient();
  const suffix = Date.now().toString(36);
  const oldEmail = "old-" + suffix + "@manageos.test";
  const nextEmail = "new-" + suffix + "@manageos.test";
  const {userId} = await registerAndLogin(account,"Email Security " + suffix,oldEmail);

  // A direct profile update must not silently move the recovery address.
  const direct = await account.put("/api/users/" + userId, {
    firstName:"Owner",lastName:"Tester",email:nextEmail,
    phone:null,country:null,timezone:null,jobTitle:null,avatarUrl:null
  });
  assert.equal(direct.status,409,JSON.stringify(direct.body));
  assert.equal(direct.body.error.code,"EMAIL_CHANGE_REQUIRES_VERIFICATION");

  const badPassword = await account.post("/api/users/me/email-change",{
    newEmail:nextEmail,currentPassword:"Wrong-Password-2026!"
  });
  assert.equal(badPassword.status,401);
  const started = await account.post("/api/users/me/email-change",{
    newEmail:nextEmail,currentPassword:secret
  });
  assert.equal(started.status,202,JSON.stringify(started.body));
  const token = started.body.data.testVerificationToken;
  assert.match(token,/^[a-f0-9]{64}$/);

  // Email cannot be used for login or recovery until the inbox verifies it.
  const before = await pool.query("SELECT email FROM users WHERE id=$1",[userId]);
  assert.equal(before.rows[0].email,oldEmail);
  const notYet = await newSession.post("/api/auth/login",{
    email:nextEmail,password:secret
  });
  assert.equal(notYet.status,401);
  const forged = await newSession.post("/api/auth/confirm-email-change",{
    token:"f".repeat(64)
  });
  assert.equal(forged.status,400);

  const confirmation = await newSession.post("/api/auth/confirm-email-change",{token});
  assert.equal(confirmation.status,200,JSON.stringify(confirmation.body));
  const reused = await newSession.post("/api/auth/confirm-email-change",{token});
  assert.equal(reused.status,400);

  const oldSession = await account.get("/api/auth/me");
  assert.equal(oldSession.status,401);
  const after = await pool.query("SELECT email FROM users WHERE id=$1",[userId]);
  assert.equal(after.rows[0].email,nextEmail);
  const newLogin = await newSession.post("/api/auth/login",{
    email:nextEmail,password:secret
  });
  assert.equal(newLogin.status,200,JSON.stringify(newLogin.body));

  const audit = await pool.query(
    "SELECT 1 FROM audit_logs WHERE actor_id=$1 AND action='USER_EMAIL_CHANGED' LIMIT 1",
    [userId]
  );
  assert.equal(audit.rows.length,1);
});


// Release PostgreSQL connections so CI exits promptly after assertions.
test.after(async () => { await pool.end(); });
