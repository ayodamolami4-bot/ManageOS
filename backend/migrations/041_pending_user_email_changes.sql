-- Email change requests never mutate the active login address.
CREATE TABLE pending_user_email_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  old_email VARCHAR(255) NOT NULL,
  new_email VARCHAR(254) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pending_user_email_changes_expiry ON pending_user_email_changes (expires_at);
