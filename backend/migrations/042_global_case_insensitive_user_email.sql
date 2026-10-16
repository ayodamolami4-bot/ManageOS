-- ManageOS uses an email address as a globally unique login identifier.
-- Existing (company_id,email) uniqueness is insufficient for invitations:
-- the same address in two companies makes authentication ambiguous.
-- Deployment prerequisite: verify no case-insensitive duplicate groups.
CREATE UNIQUE INDEX idx_users_email_global_case_insensitive_unique
  ON users (LOWER(email));
