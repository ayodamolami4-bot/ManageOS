-- Do not create companies/OWNER accounts until the supplied inbox is verified.
-- Only a SHA-256 digest is persisted; raw bearer tokens leave only by email.
CREATE TABLE pending_company_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR(200) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pending_company_registrations_expiry
  ON pending_company_registrations (expires_at);
