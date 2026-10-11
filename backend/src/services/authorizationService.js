const pool =
  require("../db/database");

async function hasPermission(
  userId,
  permissionName
) {
  const result =
    await pool.query(
      `
      SELECT 1
      FROM user_roles ur
      JOIN roles r
        ON r.id = ur.role_id
      JOIN role_permissions rp
        ON rp.role_id = r.id
      JOIN permissions p
        ON p.id = rp.permission_id
      WHERE ur.user_id = $1
        AND p.name = $2
      LIMIT 1
      `,
      [
        userId,
        permissionName
      ]
    );

  return result.rows.length > 0;
}

async function hasRole(
  userId,
  roleName,
  organizationUnitId = null
) {
  const result =
    await pool.query(
      `
      SELECT 1
      FROM user_roles ur
      JOIN roles r
        ON r.id = ur.role_id
      WHERE ur.user_id = $1
        AND r.name = $2
        AND (
          ur.organization_unit_id IS NULL
          OR ur.organization_unit_id = $3
        )
      LIMIT 1
      `,
      [
        userId,
        roleName,
        organizationUnitId
      ]
    );

  return result.rows.length > 0;
}

async function isOwner(
  userId
) {
  const result =
    await pool.query(
      `
      SELECT 1
      FROM user_roles ur
      JOIN roles r
        ON r.id = ur.role_id
      WHERE ur.user_id = $1
        AND r.name = 'OWNER'
        AND r.company_id IS NULL
        AND r.is_system = TRUE
        AND ur.organization_unit_id IS NULL
      LIMIT 1
      `,
      [userId]
    );

  return result.rows.length > 0;
}

async function isCompanyWideManager(
  userId
) {
  const result =
    await pool.query(
      `
      SELECT 1
      FROM user_roles ur
      JOIN roles r
        ON r.id = ur.role_id
      WHERE ur.user_id = $1
        AND r.name = 'MANAGER'
        AND r.company_id IS NULL
        AND r.is_system = TRUE
        AND ur.organization_unit_id IS NULL
      LIMIT 1
      `,
      [userId]
    );

  return result.rows.length > 0;
}

async function isUserInCompany(
  userId,
  companyId
) {
  const result =
    await pool.query(
      `
      SELECT 1
      FROM users
      WHERE id = $1
        AND company_id = $2
      LIMIT 1
      `,
      [
        userId,
        companyId
      ]
    );

  return result.rows.length > 0;
}

async function isOrganizationUnitInCompany(
  organizationUnitId,
  companyId
) {
  const result =
    await pool.query(
      `
      SELECT 1
      FROM organization_units
      WHERE id = $1
        AND company_id = $2
      LIMIT 1
      `,
      [
        organizationUnitId,
        companyId
      ]
    );

  return result.rows.length > 0;
}

async function managerCanAccessProject(
  userId,
  companyId,
  projectId
) {
  const result =
    await pool.query(
      `
      SELECT 1
      FROM user_roles ur
      JOIN roles r
        ON r.id = ur.role_id
      WHERE ur.user_id = $1
        AND r.name = 'MANAGER'
        AND r.company_id IS NULL
        AND r.is_system = TRUE
        AND (
          ur.organization_unit_id IS NULL
          OR EXISTS (
            SELECT 1
            FROM project_organization_units pou
            WHERE pou.project_id = $3
              AND pou.organization_unit_id =
                  ur.organization_unit_id
          )
        )
        AND EXISTS (
          SELECT 1
          FROM projects p
          WHERE p.id = $3
            AND p.company_id = $2
        )
      LIMIT 1
      `,
      [
        userId,
        companyId,
        projectId
      ]
    );

  return result.rows.length > 0;
}

async function isProjectLead(
  userId,
  companyId,
  projectId
) {
  const result =
    await pool.query(
      `
      SELECT 1
      FROM project_leads pl
      JOIN projects p
        ON p.id = pl.project_id
      WHERE pl.user_id = $1
        AND pl.project_id = $3
        AND p.company_id = $2
      LIMIT 1
      `,
      [
        userId,
        companyId,
        projectId
      ]
    );

  return result.rows.length > 0;
}

async function isProjectMember(
  userId,
  companyId,
  projectId
) {
  const result =
    await pool.query(
      `
      SELECT 1
      FROM project_members pm
      JOIN projects p
        ON p.id = pm.project_id
      WHERE pm.user_id = $1
        AND pm.project_id = $3
        AND p.company_id = $2
      LIMIT 1
      `,
      [
        userId,
        companyId,
        projectId
      ]
    );

  return result.rows.length > 0;
}

async function isTaskAssignee(
  userId,
  companyId,
  taskId
) {
  const result =
    await pool.query(
      `
      SELECT 1
      FROM task_assignments ta
      JOIN tasks t
        ON t.id = ta.task_id
      WHERE ta.user_id = $1
        AND ta.task_id = $3
        AND ta.ended_at IS NULL
        AND t.company_id = $2
      LIMIT 1
      `,
      [
        userId,
        companyId,
        taskId
      ]
    );

  return result.rows.length > 0;
}

async function getTaskProjectId(
  taskId,
  companyId
) {
  const result =
    await pool.query(
      `
      SELECT project_id
      FROM tasks
      WHERE id = $1
        AND company_id = $2
      LIMIT 1
      `,
      [
        taskId,
        companyId
      ]
    );

  return (
    result.rows[0]?.project_id ||
    null
  );
}

async function canViewProject(
  user,
  projectId
) {
  const permission =
    await hasPermission(
      user.id,
      "project.view"
    );

  if (!permission) {
    return false;
  }

  if (
    await isOwner(user.id)
  ) {
    return await managerCanAccessProject(
      user.id,
      user.company_id,
      projectId
    ) || await pool.query(
      `
      SELECT 1
      FROM projects
      WHERE id = $1
        AND company_id = $2
      LIMIT 1
      `,
      [
        projectId,
        user.company_id
      ]
    ).then(
      (result) =>
        result.rows.length > 0
    );
  }

  if (
    await managerCanAccessProject(
      user.id,
      user.company_id,
      projectId
    )
  ) {
    return true;
  }

  if (
    await isProjectLead(
      user.id,
      user.company_id,
      projectId
    )
  ) {
    return true;
  }

  return await isProjectMember(
    user.id,
    user.company_id,
    projectId
  );
}

async function canManageProject(
  user,
  projectId
) {
  const permission =
    await hasPermission(
      user.id,
      "project.manage"
    );

  if (!permission) {
    return false;
  }

  const projectResult =
    await pool.query(
      `
      SELECT 1
      FROM projects
      WHERE id = $1
        AND company_id = $2
      LIMIT 1
      `,
      [
        projectId,
        user.company_id
      ]
    );

  if (
    projectResult.rows.length === 0
  ) {
    return false;
  }

  if (
    await isOwner(user.id)
  ) {
    return true;
  }

  if (
    await managerCanAccessProject(
      user.id,
      user.company_id,
      projectId
    )
  ) {
    return true;
  }

  return await isProjectLead(
    user.id,
    user.company_id,
    projectId
  );
}

async function canViewTask(
  user,
  taskId
) {
  const permission =
    await hasPermission(
      user.id,
      "task.view"
    );

  if (!permission) {
    return false;
  }

  const projectId =
    await getTaskProjectId(
      taskId,
      user.company_id
    );

  if (!projectId) {
    return false;
  }

  if (
    await canViewProject(
      user,
      projectId
    )
  ) {
    return true;
  }

  return await isTaskAssignee(
    user.id,
    user.company_id,
    taskId
  );
}

async function canManageTask(
  user,
  taskId
) {
  const permission =
    await hasPermission(
      user.id,
      "task.manage"
    );

  if (!permission) {
    return false;
  }

  const projectId =
    await getTaskProjectId(
      taskId,
      user.company_id
    );

  if (!projectId) {
    return false;
  }

  if (
    await isOwner(user.id)
  ) {
    return true;
  }

  if (
    await managerCanAccessProject(
      user.id,
      user.company_id,
      projectId
    )
  ) {
    return true;
  }

  return await isProjectLead(
    user.id,
    user.company_id,
    projectId
  );
}

async function canReviewTask(
  user,
  taskId
) {
  const permission =
    await hasPermission(
      user.id,
      "task.review"
    );

  if (!permission) {
    return false;
  }

  const projectId =
    await getTaskProjectId(
      taskId,
      user.company_id
    );

  if (!projectId) {
    return false;
  }

  if (
    await isOwner(user.id)
  ) {
    return true;
  }

  if (
    await managerCanAccessProject(
      user.id,
      user.company_id,
      projectId
    )
  ) {
    return true;
  }

  return await isProjectLead(
    user.id,
    user.company_id,
    projectId
  );
}

async function canManageUser(
  user,
  targetUserId
) {
  const targetInCompany =
    await isUserInCompany(
      targetUserId,
      user.company_id
    );

  if (!targetInCompany) {
    return false;
  }

  if (
    await isOwner(user.id)
  ) {
    return true;
  }

  const permission =
    await hasPermission(
      user.id,
      "people.manage"
    );

  if (!permission) {
    return false;
  }

  if (
    await isCompanyWideManager(
      user.id
    )
  ) {
    return true;
  }

  const result =
    await pool.query(
      `
      SELECT 1
      FROM user_roles manager_role
      JOIN roles manager_role_def
        ON manager_role_def.id =
           manager_role.role_id
      JOIN organization_memberships target_membership
        ON target_membership.user_id = $2
      WHERE manager_role.user_id = $1
        AND manager_role_def.name = 'MANAGER'
        AND manager_role.organization_unit_id =
            target_membership.organization_unit_id
      LIMIT 1
      `,
      [
        user.id,
        targetUserId
      ]
    );

  return result.rows.length > 0;
}

async function canCreateProject(
  user
) {
  const permission =
    await hasPermission(
      user.id,
      "project.manage"
    );

  if (!permission) {
    return false;
  }

  if (
    await isOwner(user.id)
  ) {
    return true;
  }

  return await isCompanyWideManager(
    user.id
  );
}

async function canCreateTask(
  user,
  projectId
) {
  return await canManageProject(
    user,
    projectId
  );
}

async function canSubmitTask(
  user,
  taskId
) {
  const permission =
    await hasPermission(
      user.id,
      "task.view"
    );

  if (!permission) {
    return false;
  }

  return await isTaskAssignee(
    user.id,
    user.company_id,
    taskId
  );
}

async function canChangeTaskStatus(
  user,
  taskId,
  newStatus
) {
  const taskResult =
    await pool.query(
      `
      SELECT
        id,
        status,
        project_id
      FROM tasks
      WHERE id = $1
        AND company_id = $2
      LIMIT 1
      `,
      [
        taskId,
        user.company_id
      ]
    );

  const task =
    taskResult.rows[0];

  if (!task) {
    return false;
  }

  if (
    await isOwner(user.id)
  ) {
    return true;
  }

  const selfManagedStatuses = {
    ASSIGNED: [
      "IN_PROGRESS"
    ],

    IN_PROGRESS: [
      "SUBMITTED"
    ],

    NEEDS_CHANGES: [
      "IN_PROGRESS"
    ]
  };

  const selfAllowed =
    selfManagedStatuses[
      task.status
    ] || [];

  if (
    selfAllowed.includes(
      newStatus
    )
  ) {
    const taskViewPermission =
      await hasPermission(
        user.id,
        "task.view"
      );

    if (
      taskViewPermission &&
      (
        await isTaskAssignee(
          user.id,
          user.company_id,
          taskId
        )
      )
    ) {
      return true;
    }
  }

  if (
    task.status === "SUBMITTED" &&
    newStatus ===
      "TEAM_LEAD_REVIEW"
  ) {
    return await canReviewTask(
      user,
      taskId
    );
  }

  if (
    task.status ===
      "TEAM_LEAD_REVIEW" &&
    (
      newStatus === "APPROVED" ||
      newStatus ===
        "NEEDS_CHANGES"
    )
  ) {
    return await canReviewTask(
      user,
      taskId
    );
  }

  if (
    task.status === "APPROVED" &&
    newStatus ===
      "COMPLETED"
  ) {
    return await canManageTask(
      user,
      taskId
    );
  }

  return false;
}

async function canViewGoal(
  user
) {
  return await hasPermission(
    user.id,
    "goal.view"
  );
}

async function canManageGoal(
  user
) {
  const permission =
    await hasPermission(
      user.id,
      "goal.manage"
    );

  if (!permission) {
    return false;
  }

  if (
    await isOwner(user.id)
  ) {
    return true;
  }

  return await isCompanyWideManager(
    user.id
  );
}

async function getManagerOrganizationUnits(
  userId
) {
  const result =
    await pool.query(
      `
      SELECT
        ur.organization_unit_id
      FROM user_roles ur
      JOIN roles r
        ON r.id = ur.role_id
      WHERE ur.user_id = $1
        AND r.name = 'MANAGER'
        AND r.company_id IS NULL
        AND r.is_system = TRUE
        AND ur.organization_unit_id IS NOT NULL
      `,
      [userId]
    );

  return result.rows.map(
    (row) =>
      row.organization_unit_id
  );
}

async function canManageOrganizationUnit(
  user,
  organizationUnitId
) {
  if (
    organizationUnitId
  ) {
    const belongsToCompany =
      await isOrganizationUnitInCompany(
        organizationUnitId,
        user.company_id
      );

    if (!belongsToCompany) {
      return false;
    }
  }

  if (!organizationUnitId) {
    return (
      (await isOwner(
        user.id
      )) ||
      (
        await isCompanyWideManager(
          user.id
        )
      )
    );
  }

  if (
    await isOwner(user.id)
  ) {
    return true;
  }

  if (
    await isCompanyWideManager(
      user.id
    )
  ) {
    return true;
  }

  const scopedUnits =
    await getManagerOrganizationUnits(
      user.id
    );

  return scopedUnits.includes(
    organizationUnitId
  );
}

async function canManageTargetUser(
  user,
  targetUserId
) {
  const targetInCompany =
    await isUserInCompany(
      targetUserId,
      user.company_id
    );

  if (!targetInCompany) {
    return false;
  }

  if (
    user.id === targetUserId
  ) {
    return true;
  }

  if (
    await isOwner(user.id)
  ) {
    return true;
  }

  if (
    await isCompanyWideManager(
      user.id
    )
  ) {
    return true;
  }

  const scopedUnits =
    await getManagerOrganizationUnits(
      user.id
    );

  if (
    scopedUnits.length === 0
  ) {
    return false;
  }

  const result =
    await pool.query(
      `
      SELECT 1
      FROM organization_memberships om
      WHERE om.user_id = $1
        AND om.organization_unit_id =
            ANY($2::uuid[])
      LIMIT 1
      `,
      [
        targetUserId,
        scopedUnits
      ]
    );

  return result.rows.length > 0;
}

async function canAssignRole(
  user,
  roleId,
  organizationUnitId = null
) {
  const roleResult =
    await pool.query(
      `
      SELECT
        name,
        company_id,
        is_system
      FROM roles
      WHERE id = $1
        AND (
          company_id = $2
          OR (
            company_id IS NULL
            AND is_system = TRUE
          )
        )
      LIMIT 1
      `,
      [
        roleId,
        user.company_id
      ]
    );

  const role =
    roleResult.rows[0];

  if (!role) {
    return false;
  }

  if (
    role.name === "OWNER" ||
    role.name === "MANAGER"
  ) {
    return await isOwner(
      user.id
    );
  }

  return await canManageOrganizationUnit(
    user,
    organizationUnitId
  );
}

async function canCreateInvitation(
  user,
  {
    roleId,
    organizationUnitId
  }
) {
  if (
    !(
      await hasPermission(
        user.id,
        "people.manage"
      )
    )
  ) {
    return false;
  }

  if (
    !(
      await canAssignRole(
        user,
        roleId,
        organizationUnitId
      )
    )
  ) {
    return false;
  }

  return await canManageOrganizationUnit(
    user,
    organizationUnitId
  );
}

module.exports = {
  hasPermission,
  hasRole,
  isOwner,
  isCompanyWideManager,
  managerCanAccessProject,
  isProjectLead,
  isProjectMember,
  isTaskAssignee,
  getTaskProjectId,
  canViewProject,
  canManageProject,
  canViewTask,
  canManageTask,
  canReviewTask,
  canManageUser,
  canCreateProject,
  canCreateTask,
  canSubmitTask,
  canChangeTaskStatus,
  canViewGoal,
  canManageGoal,
  getManagerOrganizationUnits,
  canManageOrganizationUnit,
  canManageTargetUser,
  canAssignRole,
  canCreateInvitation
};