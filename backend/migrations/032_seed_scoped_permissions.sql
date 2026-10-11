INSERT INTO permissions (name, description)
SELECT v.name, v.description
FROM (
    VALUES
        (
            'people.manage',
            'Manage users, roles, and organization memberships'
        ),
        (
            'project.view',
            'View projects within the user scope'
        ),
        (
            'project.manage',
            'Create and manage projects within the user scope'
        ),
        (
            'task.view',
            'View tasks within the user scope'
        ),
        (
            'task.manage',
            'Manage tasks within the user scope'
        ),
        (
            'task.review',
            'Review submitted task work within the user scope'
        )
) AS v(name, description)
WHERE NOT EXISTS (
    SELECT 1
    FROM permissions p
    WHERE p.name = v.name
);

-- OWNER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'OWNER'
  AND r.company_id IS NULL
  AND r.is_system = TRUE
  AND p.name IN (
      'people.manage',
      'project.view',
      'project.manage',
      'task.view',
      'task.manage',
      'task.review'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );

-- MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'MANAGER'
  AND r.company_id IS NULL
  AND r.is_system = TRUE
  AND p.name IN (
      'people.manage',
      'project.view',
      'project.manage',
      'task.view',
      'task.manage',
      'task.review'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );

-- TEAM LEAD
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'TEAM_LEAD'
  AND r.company_id IS NULL
  AND r.is_system = TRUE
  AND p.name IN (
      'project.view',
      'project.manage',
      'task.view',
      'task.manage',
      'task.review'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );

-- EMPLOYEE
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'EMPLOYEE'
  AND r.company_id IS NULL
  AND r.is_system = TRUE
  AND p.name IN (
      'project.view',
      'task.view'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = r.id
        AND rp.permission_id = p.id
  );