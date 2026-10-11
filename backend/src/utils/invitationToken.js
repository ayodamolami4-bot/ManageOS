const crypto = require("crypto");

/*
 * Invitation tokens are generated from
 * cryptographically secure random bytes.
 *
 * We store only a SHA-256 hash in the
 * database, never the raw invitation token.
 */
function hashInvitationToken(token) {
  return crypto
    .createHash("sha256")
    .update(String(token))
    .digest("hex");
}

module.exports = {
  hashInvitationToken
};