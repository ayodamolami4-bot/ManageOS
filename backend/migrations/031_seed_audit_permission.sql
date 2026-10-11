INSERT INTO permissions (name, description)
SELECT
    'audit.view',
    'View company audit logs'
WHERE NOT EXISTS (
    SELECT 1
    FROM permissions
    WHERE name = 'audit.view'
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id,
    p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'OWNER'
  AND r.company_id IS NULL
  AND r.is_system = TRUE
  AND p.name = 'audit.view'
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );