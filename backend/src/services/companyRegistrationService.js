const crypto = require("node:crypto");
const pool = require("../db/database");
const { hashPassword } = require("../utils/password");
const emailService = require("./emailService");

const VERIFICATION_HOURS = 24;
const RETRY_MINUTES = 2;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function validToken(token) {
  return typeof token === "string" && /^[a-f0-9]{64}$/i.test(token);
}

// Pending records are NOT accounts, companies or sessions. No OWNER privileges
// are granted until the mailbox owner redeems a one-time verification token.
async function beginCompanyRegistration(data, { send = emailService.sendCompanyVerificationEmail } = {}) {
  if (process.env.NODE_ENV !== "test" && !emailService.configured()) {
    throw new Error("REGISTRATION_EMAIL_UNAVAILABLE");
  }
  const email = data.email.trim().toLowerCase();
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const passwordHash = await hashPassword(data.password);

  const client = await pool.connect();
  let pending;
  try {
    await client.query("BEGIN");

    // Serialize attempts for the same email; prevents parallel resends from
    // racing and overwriting the token just mailed to the account owner.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [email]);
    const existing = await client.query(
      "SELECT 1 FROM users WHERE LOWER(email) = $1 LIMIT 1", [email]
    );
    if (existing.rows.length) throw new Error("REGISTRATION_EMAIL_IN_USE");

    const prior = await client.query(
      "SELECT id, created_at FROM pending_company_registrations WHERE email = $1 FOR UPDATE",
      [email]
    );
    if (prior.rows[0] && Date.now() - new Date(prior.rows[0].created_at).getTime() <
        RETRY_MINUTES * 60 * 1000) {
      throw new Error("REGISTRATION_RETRY_LATER");
    }

    // A new attempt cancels an older verification link for the same address.
    const result = await client.query(
      `INSERT INTO pending_company_registrations (
         company_name, first_name, last_name, email, password_hash, token_hash, expires_at
       ) VALUES ($1,$2,$3,$4,$5,$6,NOW() + INTERVAL '24 hours')
       ON CONFLICT (email) DO UPDATE SET
         company_name = EXCLUDED.company_name,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         password_hash = EXCLUDED.password_hash,
         token_hash = EXCLUDED.token_hash,
         expires_at = EXCLUDED.expires_at,
         created_at = NOW()
       RETURNING id`,
      [data.companyName.trim(), data.firstName.trim(), data.lastName.trim(),
        email, passwordHash, tokenHash]
    );
    pending = result.rows[0];
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  try {
    // The NODE_ENV=test branch is deliberately only for isolated CI; it
    // never appears on a deployed production API.
    if (process.env.NODE_ENV !== "test") {
      await send({
        to: email, token, companyName: data.companyName.trim(), registrationId: pending.id
      });
    }
  } catch {
    await pool.query(
      "DELETE FROM pending_company_registrations WHERE id = $1 AND token_hash = $2",
      [pending.id, tokenHash]
    );
    throw new Error("REGISTRATION_EMAIL_DELIVERY_FAILED");
  }

  return process.env.NODE_ENV === "test"
    ? { testVerificationToken: token }
    : {};
}

async function verifyCompanyRegistration(token) {
  if (!validToken(token)) throw new Error("REGISTRATION_TOKEN_INVALID");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const pendingResult = await client.query(
      `SELECT id, company_name, first_name, last_name, email, password_hash
       FROM pending_company_registrations
       WHERE token_hash = $1 AND expires_at > NOW()
       FOR UPDATE`,
      [hashToken(token)]
    );
    const pending = pendingResult.rows[0];
    if (!pending) throw new Error("REGISTRATION_TOKEN_INVALID");

    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [pending.email]);
    const usedEmail = await client.query(
      "SELECT 1 FROM users WHERE LOWER(email) = $1 LIMIT 1", [pending.email]
    );
    if (usedEmail.rows.length) throw new Error("REGISTRATION_EMAIL_IN_USE");

    const company = (await client.query(
      `INSERT INTO companies (name) VALUES ($1)
       RETURNING id, name, created_at`, [pending.company_name]
    )).rows[0];

    const user = (await client.query(
      `INSERT INTO users (company_id, first_name, last_name, email, password_hash)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, company_id, first_name, last_name, email, created_at`,
      [company.id, pending.first_name, pending.last_name, pending.email, pending.password_hash]
    )).rows[0];

    const roleResult = await client.query(
      `SELECT id FROM roles WHERE name='OWNER' AND company_id IS NULL
       AND is_system = TRUE LIMIT 1`
    );
    if (!roleResult.rows[0]) throw new Error("OWNER_ROLE_MISSING");

    await client.query(
      "INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES ($1,$2,$1)",
      [user.id, roleResult.rows[0].id]
    );
    await client.query(
      "DELETE FROM pending_company_registrations WHERE id = $1",
      [pending.id]
    );
    await client.query("COMMIT");
    return { company, user };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  beginCompanyRegistration,
  verifyCompanyRegistration,
  validToken,
  hashToken,
  VERIFICATION_HOURS,
  RETRY_MINUTES
};
