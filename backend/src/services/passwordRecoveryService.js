const crypto = require("node:crypto");
const pool = require("../db/database");
const { hashPassword } = require("../utils/password");
const emailService = require("./emailService");

const TOKEN_TTL_MINUTES = 30;
const REQUEST_COOLDOWN_MINUTES = 5;

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function requestPasswordReset(email, { send = emailService.sendPasswordResetEmail } = {}) {
  // Never claim success if email cannot be delivered. Both known and unknown
  // accounts receive the same response when the provider is unavailable.
  if (send === emailService.sendPasswordResetEmail && !emailService.configured()) {
    throw new Error("EMAIL_NOT_CONFIGURED");
  }
  const normalized = email.trim().toLowerCase();
  const result = await pool.query(
    "SELECT id, email FROM users WHERE LOWER(email) = $1 LIMIT 2", [normalized]
  );
  const user = result.rows[0];
  // Generic responses are returned regardless of whether this email exists.
  if (!user || result.rows.length !== 1) return;

  const token = generateResetToken();
  const tokenHash = hashResetToken(token);
  const client = await pool.connect();
  let inserted = false;
  try {
    await client.query("BEGIN");
    const locked = await client.query(
      "SELECT id FROM users WHERE id = $1 FOR UPDATE", [user.id]
    );
    if (!locked.rows.length) {
      await client.query("ROLLBACK");
      return;
    }
    const recent = await client.query(
      `SELECT 1 FROM password_reset_tokens
       WHERE user_id = $1
         AND created_at > NOW() - INTERVAL '5 minutes'
         AND used_at IS NULL LIMIT 1`,
      [user.id]
    );
    if (recent.rows.length) {
      await client.query("COMMIT");
      return;
    }
    await client.query(
      `UPDATE password_reset_tokens SET used_at = NOW()
       WHERE user_id = $1 AND used_at IS NULL`,
      [user.id]
    );
    await client.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
      [user.id, tokenHash]
    );
    await client.query("COMMIT");
    inserted = true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  if (inserted) {
    try {
      await send({ to: user.email, token });
    } catch (error) {
      // Do not leave a usable token behind if the message was not sent.
      await pool.query(
        "UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1",
        [tokenHash]
      );
      throw new Error("EMAIL_DELIVERY_FAILED");
    }
  }
}

async function resetPassword(token, newPassword) {
  const tokenHash = hashResetToken(token);
  const passwordHash = await hashPassword(newPassword);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT prt.id, prt.user_id, u.company_id
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token_hash = $1 AND prt.used_at IS NULL
         AND prt.expires_at > NOW()
       FOR UPDATE OF prt, u`,
      [tokenHash]
    );
    const row = result.rows[0];
    if (!row) throw new Error("PASSWORD_RESET_TOKEN_INVALID");

    await client.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [passwordHash, row.user_id]
    );
    await client.query(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL",
      [row.user_id]
    );
    // Invalidate every existing session, including the session that
    // requested the reset. The next login must use the new password.
    await client.query("DELETE FROM sessions WHERE user_id = $1", [row.user_id]);
    await client.query(
      `INSERT INTO audit_logs
       (company_id, actor_id, action, resource_type, resource_id, metadata)
       VALUES ($1, $2, 'USER_PASSWORD_RESET', 'USER', $2, $3)`,
      [row.company_id, row.user_id, { sessions_revoked: true }]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  hashResetToken,
  generateResetToken,
  requestPasswordReset,
  resetPassword,
  TOKEN_TTL_MINUTES,
  REQUEST_COOLDOWN_MINUTES,
};
