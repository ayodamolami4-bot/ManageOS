INSERT INTO permissions (name, description)
VALUES
    ('company.manage', 'Manage company settings and organization');
    INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'OWNER'
  AND r.company_id IS NULL
  AND p.name = 'company.manage';