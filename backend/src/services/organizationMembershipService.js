const pool = require("../db/database");

const {
  createOrganizationMembershipWithAudit,
  getOrganizationMembershipsForUser,
  getOrganizationMembershipById,
  deleteOrganizationMembershipWithAudit
} = require("../repositories/organizationMembershipRepository");

const {
  canManageOrganizationUnit,
  canManageTargetUser
} = require("./authorizationService");

/**
 * Add a user to an organization unit.
 *
 * Rules:
 *
 * OWNER
 * -> any company user / any organization unit
 *
 * COMPANY-WIDE MANAGER
 * -> any company user / any organization unit
 *
 * SCOPED MANAGER
 * -> users in their permitted organization scope
 *
 * TEAM_LEAD
 * -> can add EMPLOYEES to their own team
 */
async function addUserToOrganizationUnit(
  {
    userId,
    organizationUnitId
  },
  currentUser
) {
  if (!userId) {
    throw new Error(
      "USER_ID_REQUIRED"
    );
  }

  if (!organizationUnitId) {
    throw new Error(
      "ORGANIZATION_UNIT_ID_REQUIRED"
    );
  }

  /**
   * Verify target user belongs to
   * the same company.
   */
  const userResult =
    await pool.query(
      `
      SELECT
        id,
        company_id
      FROM users
      WHERE id = $1
        AND company_id = $2
      LIMIT 1
      `,
      [
        userId,
        currentUser.company_id
      ]
    );

  const targetUser =
    userResult.rows[0];

  if (!targetUser) {
    throw new Error(
      "USER_NOT_FOUND"
    );
  }

  /**
   * Verify organization unit belongs
   * to the current user's company.
   */
  const organizationUnitResult =
    await pool.query(
      `
      SELECT
        id,
        company_id,
        name
      FROM organization_units
      WHERE id = $1
        AND company_id = $2
      LIMIT 1
      `,
      [
        organizationUnitId,
        currentUser.company_id
      ]
    );

  const organizationUnit =
    organizationUnitResult.rows[0];

  if (!organizationUnit) {
    throw new Error(
      "ORGANIZATION_UNIT_NOT_FOUND"
    );
  }

  /**
   * First check normal management scope.
   */
  let allowed =
    await canManageOrganizationUnit(
      currentUser,
      organizationUnitId
    );

  /**
   * Team Lead exception:
   *
   * A Team Lead may add people to the
   * organization unit they themselves lead.
   */
  if (!allowed) {
    allowed =
      await isTeamLeadOfOrganizationUnit(
        currentUser.id,
        organizationUnitId
      );

    if (allowed) {
      /**
       * Team Leads can only add employees
       * to their own team.
       */
      const employee =
        await isEmployee(
          userId
        );

      if (!employee) {
        throw new Error(
          "TEAM_LEAD_CAN_ONLY_ADD_EMPLOYEES"
        );
      }
    }
  }

  if (!allowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  /**
   * For non-Team-Lead management,
   * preserve target-user scope checks.
   *
   * Team Leads deliberately don't use this
   * check because a new team member may have
   * no organization membership yet.
   */
  const isLead =
    await isTeamLeadOfOrganizationUnit(
      currentUser.id,
      organizationUnitId
    );

  if (!isLead) {
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
  }

  /**
   * Create membership with existing
   * activity/audit behavior.
   */
  return createOrganizationMembershipWithAudit({
    userId,
    organizationUnitId,
    companyId:
      currentUser.company_id,
    actorId:
      currentUser.id
  });
}

/**
 * Get the current user's memberships.
 */
async function getMyMemberships(
  currentUser
) {
  return getOrganizationMembershipsForUser(
    currentUser.id,
    currentUser.company_id
  );
}

/**
 * Get another user's memberships.
 *
 * Team Leads can inspect memberships
 * of users inside their own team.
 */
async function getUserMemberships(
  userId,
  currentUser
) {
  const targetUser =
    await getCompanyUser(
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
    const sameTeam =
      await isTeamLeadOfAnySharedUnit(
        currentUser.id,
        userId
      );

    allowed = sameTeam;
  }

  if (!allowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  return getOrganizationMembershipsForUser(
    userId,
    currentUser.company_id
  );
}

/**
 * Remove a user from an organization unit.
 *
 * Team Leads may remove employees from
 * the team they lead.
 */
async function removeMembership(
  membershipId,
  currentUser
) {
  const membership =
    await getOrganizationMembershipById(
      membershipId,
      currentUser.company_id
    );

  if (!membership) {
    throw new Error(
      "MEMBERSHIP_NOT_FOUND"
    );
  }

  let allowed =
    await canManageOrganizationUnit(
      currentUser,
      membership.organization_unit_id
    );

  if (!allowed) {
    allowed =
      await isTeamLeadOfOrganizationUnit(
        currentUser.id,
        membership.organization_unit_id
      );

    if (allowed) {
      const employee =
        await isEmployee(
          membership.user_id
        );

      if (!employee) {
        throw new Error(
          "TEAM_LEAD_CAN_ONLY_MANAGE_EMPLOYEES"
        );
      }
    }
  }

  if (!allowed) {
    throw new Error(
      "FORBIDDEN"
    );
  }

  return deleteOrganizationMembershipWithAudit({
    membershipId,
    companyId:
      currentUser.company_id,
    actorId:
      currentUser.id
  });
}

/**
 * Check whether a Team Lead leads
 * a specific organization unit.
 */
async function isTeamLeadOfOrganizationUnit(
  userId,
  organizationUnitId
) {
  const result =
    await pool.query(
      `
      SELECT 1
      FROM user_roles ur
      JOIN roles r
        ON r.id = ur.role_id
      WHERE ur.user_id = $1
        AND ur.organization_unit_id = $2
        AND r.name = 'TEAM_LEAD'
        AND r.company_id IS NULL
        AND r.is_system = TRUE
      LIMIT 1
      `,
      [
        userId,
        organizationUnitId
      ]
    );

  return result.rows.length > 0;
}

/**
 * Determine whether the target user
 * has an EMPLOYEE role.
 */
async function isEmployee(
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
        AND r.name = 'EMPLOYEE'
        AND r.company_id IS NULL
        AND r.is_system = TRUE
      LIMIT 1
      `,
      [userId]
    );

  return result.rows.length > 0;
}

/**
 * Confirm that a target user belongs
 * to an organization unit led by the
 * current Team Lead.
 */
async function isTeamLeadOfAnySharedUnit(
  leadUserId,
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
      JOIN organization_memberships target_membership
        ON target_membership.organization_unit_id =
           lead_role.organization_unit_id
      WHERE lead_role.user_id = $1
        AND lead_role_definition.name = 'TEAM_LEAD'
        AND lead_role_definition.company_id IS NULL
        AND lead_role_definition.is_system = TRUE
        AND target_membership.user_id = $2
      LIMIT 1
      `,
      [
        leadUserId,
        targetUserId
      ]
    );

  return result.rows.length > 0;
}

/**
 * Company-scoped user lookup.
 */
async function getCompanyUser(
  userId,
  companyId
) {
  const result =
    await pool.query(
      `
      SELECT id, company_id
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

  return result.rows[0] || null;
}

module.exports = {
  addUserToOrganizationUnit,
  getMyMemberships,
  getUserMemberships,
  removeMembership
};