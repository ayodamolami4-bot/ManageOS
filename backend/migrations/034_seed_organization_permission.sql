INSERT INTO permissions (name, description)
SELECT
    'organization.manage',
    'Manage company organization units and structure'
WHERE NOT EXISTS (
    SELECT 1
    FROM permissions
    WHERE name = 'organization.manage'
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN (
    'OWNER',
    'MANAGER'
)
  AND r.company_id IS NULL
  AND r.is_system = TRUE
  AND p.name = 'organization.manage'
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );