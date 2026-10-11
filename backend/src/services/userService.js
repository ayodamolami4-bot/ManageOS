const pool =
  require("../db/database");

const userRepository =
  require("../repositories/userRepository");

const {
  canAssignRole,
  canManageTargetUser
} = require(
  "./authorizationService"
);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateUserReference(
  userId
) {
  if (
    !UUID_REGEX.test(
      String(userId || "")
    )
  ) {
    throw new Error(
      "INVALID_USER_REFERENCE"
    );
  }
}

function validateRoleReference(
  roleId
) {
  if (
    !UUID_REGEX.test(
      String(roleId || "")
    )
  ) {
    throw new Error(
      "INVALID_USER_REFERENCE"
    );
  }
}

function validateOrganizationUnitReference(
  organizationUnitId
) {
  if (
    organizationUnitId &&
    !UUID_REGEX.test(
      String(
        organizationUnitId
      )
    )
  ) {
    throw new Error(
      "INVALID_ORGANIZATION_UNIT_REFERENCE"
    );
  }
}

/*
 * Get all users belonging to the
 * current user's company.
 */
async function getUsers(
  currentUser
) {
  const users =
    await userRepository.getCompanyUsers(
      currentUser.company_id
    );

  const allowedUsers =
    [];

  for (
    const user of users
  ) {
    if (
      await canManageTargetUser(
        currentUser,
        user.id
      )
    ) {
      allowedUsers.push(
        user
      );

      continue;
    }

    const teamLeadAccess =
      await canTeamLeadAccessUser(
        currentUser,
        user.id
      );

    if (
      teamLeadAccess
    ) {
      allowedUsers.push(
        user
      );
    }
  }

  return allowedUsers;
}

/*
 * Get one user belonging to
 * the current user's company.
 */
async function getUser(
  userId,
  currentUser
) {
  validateUserReference(
    userId
  );

  const user =
    await userRepository.getUserByIdAndCompany(
      userId,
      currentUser.company_id
    );

  if (!user) {
    throw new Error(
      "USER_NOT_FOUND"
    );
  }

  const allowed =
    await canManageTargetUser(
      currentUser,
      userId
    );

  if (allowed) {
    return user;
  }

  const teamLeadAccess =
    await canTeamLeadAccessUser(
      currentUser,
      userId
    );

  if (!teamLeadAccess) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  return user;
}

/*
 * Update a user's profile.
 *
 * PUT is treated as a full profile
 * replacement for the editable fields.
 */
async function updateUser(
  userId,
  updates,
  currentUser
) {
  validateUserReference(
    userId
  );

  const targetUser =
    await userRepository.getUserByIdAndCompany(
      userId,
      currentUser.company_id
    );

  if (!targetUser) {
    throw new Error(
      "USER_NOT_FOUND"
    );
  }

  let allowed =
    await canManageTargetUser(
      currentUser,
      userId
    );

  if (!allowed) {
    allowed =
      await canTeamLeadAccessUser(
        currentUser,
        userId
      );
  }

  if (!allowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  const client =
    await pool.connect();

  try {
    await userRepository.updateUserProfileWithClient(
      client,
      {
        userId,
        companyId:
          currentUser.company_id,
        actorId:
          currentUser.id,

        firstName:
          updates.firstName,
        lastName:
          updates.lastName,
        email:
          updates.email,
        phone:
          updates.phone,
        country:
          updates.country,
        timezone:
          updates.timezone,
        jobTitle:
          updates.jobTitle,
        avatarUrl:
          updates.avatarUrl
      }
    );
  } finally {
    client.release();
  }

  /*
   * Return the full user representation,
   * including roles and memberships.
   */
  return await userRepository.getUserByIdAndCompany(
    userId,
    currentUser.company_id
  );
}

/*
 * Get roles available to users in
 * the current company.
 */
async function getRoles(
  currentUser
) {
  return await userRepository.getAssignableRoles(
    currentUser.company_id
  );
}

/*
 * Assign a role to a user.
 */
async function assignRole({
  userId,
  roleId,
  organizationUnitId =
    null,
  currentUser
}) {
  validateUserReference(
    userId
  );

  validateRoleReference(
    roleId
  );

  validateOrganizationUnitReference(
    organizationUnitId
  );

  const targetUser =
    await userRepository.getUserByIdAndCompany(
      userId,
      currentUser.company_id
    );

  if (!targetUser) {
    throw new Error(
      "USER_NOT_FOUND"
    );
  }

  const targetAllowed =
    await canManageTargetUser(
      currentUser,
      userId
    );

  if (!targetAllowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  const roleAllowed =
    await canAssignRole(
      currentUser,
      roleId,
      organizationUnitId
    );

  if (!roleAllowed) {
    throw new Error(
      "ROLE_ASSIGNMENT_FORBIDDEN"
    );
  }

  const client =
    await pool.connect();

  try {
    return await userRepository.assignUserRoleWithClient(
      client,
      {
        userId,
        roleId,
        organizationUnitId:
          organizationUnitId ||
          null,
        companyId:
          currentUser.company_id,
        assignedBy:
          currentUser.id
      }
    );
  } finally {
    client.release();
  }
}

/*
 * Remove a role from a user.
 */
async function removeRole({
  userId,
  roleId,
  organizationUnitId =
    null,
  currentUser
}) {
  validateUserReference(
    userId
  );

  validateRoleReference(
    roleId
  );

  validateOrganizationUnitReference(
    organizationUnitId
  );

  const targetUser =
    await userRepository.getUserByIdAndCompany(
      userId,
      currentUser.company_id
    );

  if (!targetUser) {
    throw new Error(
      "USER_NOT_FOUND"
    );
  }

  const allowed =
    await canManageTargetUser(
      currentUser,
      userId
    );

  if (!allowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  const managerAccess =
    await canManageRoleAdministration(
      currentUser
    );

  if (!managerAccess) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  const client =
    await pool.connect();

  try {
    return await userRepository.removeUserRoleWithClient(
      client,
      {
        userId,
        roleId,
        organizationUnitId:
          organizationUnitId ||
          null,
        companyId:
          currentUser.company_id,
        removedBy:
          currentUser.id
      }
    );
  } finally {
    client.release();
  }
}

/*
 * Team Lead profile visibility.
 *
 * The target and current user must belong
 * to the same company.
 */
async function canTeamLeadAccessUser(
  currentUser,
  targetUserId
) {
  const result =
    await pool.query(
      `
      SELECT 1
      FROM user_roles lead_role
      JOIN roles lead_role_definition
        ON lead_role_definition.id =
           lead_role.role_id
      JOIN users lead_user
        ON lead_user.id =
           lead_role.user_id
      JOIN organization_memberships target_membership
        ON target_membership.organization_unit_id =
           lead_role.organization_unit_id
      JOIN users target_user
        ON target_user.id =
           target_membership.user_id
      WHERE lead_role.user_id = $1
        AND target_membership.user_id = $2
        AND lead_user.company_id = $3
        AND target_user.company_id = $3
        AND lead_role.organization_unit_id IS NOT NULL
        AND lead_role_definition.name =
            'TEAM_LEAD'
        AND lead_role_definition.company_id IS NULL
        AND lead_role_definition.is_system = TRUE
      LIMIT 1
      `,
      [
        currentUser.id,
        targetUserId,
        currentUser.company_id
      ]
    );

  return (
    result.rows.length > 0
  );
}

/*
 * Only OWNER or MANAGER can administer
 * role assignments.
 */
async function canManageRoleAdministration(
  currentUser
) {
  const result =
    await pool.query(
      `
      SELECT 1
      FROM user_roles ur
      JOIN roles r
        ON r.id = ur.role_id
      JOIN users u
        ON u.id = ur.user_id
      WHERE ur.user_id = $1
        AND u.company_id = $2
        AND r.name IN (
          'OWNER',
          'MANAGER'
        )
        AND r.company_id IS NULL
        AND r.is_system = TRUE
      LIMIT 1
      `,
      [
        currentUser.id,
        currentUser.company_id
      ]
    );

  return (
    result.rows.length > 0
  );
}

module.exports = {
  getUsers,
  getUser,
  updateUser,
  getRoles,
  assignRole,
  removeRole
};