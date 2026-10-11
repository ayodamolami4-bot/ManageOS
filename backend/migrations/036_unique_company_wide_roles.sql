-- PostgreSQL UNIQUE permits multiple NULL values. The existing
-- (user_id, role_id, organization_unit_id) constraint therefore does
-- not prevent duplicate company-wide (NULL-scoped) assignments.
-- Keep scoped roles governed by the existing composite constraint.
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_company_wide_unique
ON user_roles (user_id, role_id)
WHERE organization_unit_id IS NULL;
