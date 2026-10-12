-- Persist physical-object removal as part of the SAME transaction as a file's
-- metadata deletion. If R2 is unavailable, deletion retries survive restarts.
CREATE TABLE file_deletion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  file_id UUID NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_error_code VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_file_deletion_jobs_pending
  ON file_deletion_jobs (next_attempt_at, created_at)
  WHERE completed_at IS NULL;
