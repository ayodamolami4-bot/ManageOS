-- Company-wide activity visibility must not implicitly grant audit access.
INSERT INTO permissions (name, description)
SELECT 'activity.view', 'View the authorized company activity stream'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE name = 'activity.view'
);

-- Default to company owners until scoped activity visibility is implemented.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'OWNER'
  AND r.company_id IS NULL
  AND r.is_system = TRUE
  AND p.name = 'activity.view'
  AND NOT EXISTS (
    SELECT 1
    FROM role_permissions rp
    WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
