INSERT INTO permissions (name, description)
SELECT v.name, v.description
FROM (
    VALUES
        (
            'goal.view',
            'View company goals and objectives'
        ),
        (
            'goal.manage',
            'Create and manage company goals and objectives'
        )
) AS v(name, description)
WHERE NOT EXISTS (
    SELECT 1
    FROM permissions p
    WHERE p.name = v.name
);

-- All system roles can view company goals.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN (
    'OWNER',
    'MANAGER',
    'TEAM_LEAD',
    'EMPLOYEE'
)
  AND r.company_id IS NULL
  AND r.is_system = TRUE
  AND p.name = 'goal.view'
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );

-- Only OWNER and company-wide MANAGER receive goal management.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN (
    'OWNER',
    'MANAGER'
)
  AND r.company_id IS NULL
  AND r.is_system = TRUE
  AND p.name = 'goal.manage'
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );