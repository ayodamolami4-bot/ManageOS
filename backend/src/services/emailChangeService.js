const crypto = require("node:crypto");
const pool = require("../db/database");
const { verifyPassword } = require("../utils/password");
const emailService = require("./emailService");

const TOKEN_HOURS = 1;
const COOLDOWN_MINUTES = 5;
const hashToken = token => crypto.createHash("sha256").update(token).digest("hex");
const isToken = token => typeof token === "string" && /^[a-f0-9]{64}$/i.test(token);

// Only the signed-in account owner can request a change. Admins cannot bypass
// mailbox verification by editing another person's profile.
async function requestEmailChange(userId, companyId, newEmail, currentPassword) {
  if (!emailService.configured() && process.env.NODE_ENV !== "test") {
    throw new Error("EMAIL_CHANGE_UNAVAILABLE");
  }
  const email = newEmail.trim().toLowerCase();
  const token = crypto.randomBytes(32).toString("hex");
  const digest = hashToken(token);
  let pending, oldEmail;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const record = await client.query(
      "SELECT id, email, password_hash FROM users WHERE id=$1 AND company_id=$2 FOR UPDATE",
      [userId, companyId]
    );
    const user = record.rows[0];
    if (!user) throw new Error("USER_NOT_FOUND");
    oldEmail = user.email;
    const correct = await verifyPassword(currentPassword, user.password_hash);
    if (!correct) throw new Error("EMAIL_CHANGE_PASSWORD_INVALID");
    if (email === oldEmail.toLowerCase()) throw new Error("EMAIL_CHANGE_UNCHANGED");

    // Login currently identifies users by email alone across all companies.
    // Refuse any email already belonging to a different account.
    const collision = await client.query(
      "SELECT 1 FROM users WHERE LOWER(email)=$1 AND id<>$2 LIMIT 1", [email, userId]
    );
    if (collision.rows.length) throw new Error("EMAIL_ALREADY_IN_USE");

    const previous = await client.query(
      "SELECT created_at FROM pending_user_email_changes WHERE user_id=$1 FOR UPDATE",
      [userId]
    );
    if (previous.rows[0] &&
        Date.now() - new Date(previous.rows[0].created_at).getTime() <
        COOLDOWN_MINUTES * 60_000) {
      throw new Error("EMAIL_CHANGE_RETRY_LATER");
    }

    pending = (await client.query(
      `INSERT INTO pending_user_email_changes
       (user_id,old_email,new_email,token_hash,expires_at)
       VALUES ($1,$2,$3,$4,NOW() + INTERVAL '1 hour')
       ON CONFLICT (user_id) DO UPDATE SET
         id=gen_random_uuid(), old_email=EXCLUDED.old_email,
         new_email=EXCLUDED.new_email, token_hash=EXCLUDED.token_hash,
         expires_at=EXCLUDED.expires_at, created_at=NOW()
       RETURNING id`,
      [userId,oldEmail,email,digest]
    )).rows[0];
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  try {
    if (process.env.NODE_ENV !== "test") {
      await emailService.sendEmailChangeVerification({
        to:email, token, requestId:pending.id
      });
    }
  } catch (error) {
    await pool.query(
      "DELETE FROM pending_user_email_changes WHERE user_id=$1 AND token_hash=$2",
      [userId,digest]
    );
    throw new Error("EMAIL_CHANGE_DELIVERY_FAILED");
  }
  return process.env.NODE_ENV === "test" ? { testVerificationToken: token } : {};
}

async function confirmEmailChange(token) {
  if (!isToken(token)) throw new Error("EMAIL_CHANGE_TOKEN_INVALID");
  const digest = hashToken(token);
  const client = await pool.connect();
  let result;
  try {
    await client.query("BEGIN");
    // User row first, pending row second, matching the request flow.
    const preflight = await client.query(
      "SELECT user_id FROM pending_user_email_changes WHERE token_hash=$1 AND expires_at>NOW()",
      [digest]
    );
    if (!preflight.rows[0]) throw new Error("EMAIL_CHANGE_TOKEN_INVALID");
    const userRow = await client.query(
      "SELECT id, company_id, email FROM users WHERE id=$1 FOR UPDATE",
      [preflight.rows[0].user_id]
    );
    if (!userRow.rows[0]) throw new Error("EMAIL_CHANGE_TOKEN_INVALID");
    const pendingRow = await client.query(
      "SELECT id, new_email, old_email FROM pending_user_email_changes WHERE token_hash=$1 AND expires_at>NOW() FOR UPDATE",
      [digest]
    );
    const pending = pendingRow.rows[0];
    if (!pending || userRow.rows[0].email !== pending.old_email) {
      throw new Error("EMAIL_CHANGE_TOKEN_INVALID");
    }

    const taken = await client.query(
      "SELECT 1 FROM users WHERE LOWER(email)=$1 AND id<>$2 LIMIT 1",
      [pending.new_email,userRow.rows[0].id]
    );
    if (taken.rows.length) throw new Error("EMAIL_ALREADY_IN_USE");

    await client.query(
      "UPDATE users SET email=$1,updated_at=NOW() WHERE id=$2",
      [pending.new_email,userRow.rows[0].id]
    );
    await client.query("DELETE FROM sessions WHERE user_id=$1",[userRow.rows[0].id]);
    await client.query("DELETE FROM password_reset_tokens WHERE user_id=$1",[userRow.rows[0].id]);
    await client.query("DELETE FROM pending_user_email_changes WHERE id=$1",[pending.id]);
    await client.query(
      `INSERT INTO audit_logs (company_id,actor_id,action,resource_type,resource_id,old_values,new_values,metadata)
       VALUES ($1,$2,'USER_EMAIL_CHANGED','USER',$2,$3,$4,'{}'::jsonb)`,
      [userRow.rows[0].company_id,userRow.rows[0].id,
        {email:pending.old_email},{email:pending.new_email}]
    );
    result = {oldEmail: pending.old_email, newEmail: pending.new_email};
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") throw new Error("EMAIL_ALREADY_IN_USE");
    throw error;
  } finally {
    client.release();
  }
  // Email delivery problems must never roll back a committed security change.
  try {
    if (process.env.NODE_ENV !== "test") {
      await emailService.sendEmailChangeNotice(result);
    }
  } catch {
    console.error("Email-change security notification could not be delivered.");
  }
  return { changed: true };
}

module.exports = { requestEmailChange, confirmEmailChange, hashToken, isToken, TOKEN_HOURS, COOLDOWN_MINUTES };
