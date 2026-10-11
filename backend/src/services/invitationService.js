const crypto = require("crypto");

const pool = require("../db/database");

const {
  hashPassword
} = require("../utils/password");

const {
  hashInvitationToken
} = require("../utils/invitationToken");
const invitationRepository =
  require("../repositories/invitationRepository");

const {
  canCreateInvitation
} = require("./authorizationService");

/**
 * Create a company user invitation.
 *
 * Rules:
 *
 * OWNER
 * -> may invite anyone
 *
 * MANAGER
 * -> may invite according to management scope
 *
 * TEAM_LEAD
 * -> may invite EMPLOYEES only
 * -> organizationUnitId must be their own team
 *
 * EMPLOYEE
 * -> cannot invite users
 */
async function createUserInvitation(
  {
    email,
    roleId,
    organizationUnitId = null
  },
  currentUser
) {
  const normalizedEmail =
    String(email || "")
      .trim()
      .toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "INVALID_EMAIL"
    );
  }

  if (!roleId) {
    throw new Error(
      "ROLE_ID_REQUIRED"
    );
  }

  const roleResult =
    await pool.query(
      `
      SELECT
        id,
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
        currentUser.company_id
      ]
    );

  const role =
    roleResult.rows[0];

  if (!role) {
    throw new Error(
      "ROLE_NOT_FOUND"
    );
  }

  /**
   * Team Lead restrictions.
   */
  const isTeamLead =
    await isUserTeamLead(
      currentUser.id
    );

  if (isTeamLead) {
    if (role.name !== "EMPLOYEE") {
      throw new Error(
        "TEAM_LEAD_CAN_ONLY_INVITE_EMPLOYEES"
      );
    }

    if (!organizationUnitId) {
      throw new Error(
        "TEAM_LEAD_ORGANIZATION_UNIT_REQUIRED"
      );
    }

    const ownsOrganizationUnit =
      await isTeamLeadOfOrganizationUnit(
        currentUser.id,
        organizationUnitId
      );

    if (!ownsOrganizationUnit) {
      throw new Error(
        "INVITATION_SCOPE_FORBIDDEN"
      );
    }
  }

  /**
   * General invitation authorization.
   */
  const allowed =
    await canCreateInvitation(
      currentUser,
      {
        roleId,
        organizationUnitId
      }
    );

  /**
   * Team Lead access is deliberately
   * handled above, so don't reject them
   * merely because their permission is
   * scoped differently.
   */
  if (!allowed && !isTeamLead) {
    throw new Error(
      "INVITATION_SCOPE_FORBIDDEN"
    );
  }

  /**
   * Verify organization unit belongs
   * to the current company.
   */
  if (organizationUnitId) {
    const organizationUnitResult =
      await pool.query(
        `
        SELECT id
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

    if (
      organizationUnitResult.rows.length ===
      0
    ) {
      throw new Error(
        "ORGANIZATION_UNIT_NOT_FOUND"
      );
    }
  }

  /**
   * Do not invite an email that is
   * already registered in this company.
   */
  const existingUserResult =
    await pool.query(
      `
      SELECT id
      FROM users
      WHERE company_id = $1
        AND LOWER(email) = $2
      LIMIT 1
      `,
      [
        currentUser.company_id,
        normalizedEmail
      ]
    );

  if (existingUserResult.rows.length > 0) {
    throw new Error(
      "USER_ALREADY_EXISTS"
    );
  }

  /**
   * Prevent an existing pending invitation
   * from creating multiple active tokens
   * for the same company/email.
   */
  const pendingInvitationResult =
    await pool.query(
      `
      SELECT id
      FROM invitations
      WHERE company_id = $1
        AND LOWER(email) = $2
        AND status = 'PENDING'
        AND expires_at > NOW()
      LIMIT 1
      `,
      [
        currentUser.company_id,
        normalizedEmail
      ]
    );

  if (
    pendingInvitationResult.rows.length > 0
  ) {
    throw new Error(
      "INVITATION_ALREADY_PENDING"
    );
  }

  const rawToken =
    crypto.randomBytes(32).toString("hex");

  const tokenHash =
    hashInvitationToken(
      rawToken
    );

  const expiresAt =
    new Date(
      Date.now() +
        7 * 24 * 60 * 60 * 1000
    );

  const invitation =
    await invitationRepository.createInvitation({
      companyId:
        currentUser.company_id,
      email: normalizedEmail,
      invitedBy:
        currentUser.id,
      roleId,
      organizationUnitId,
      tokenHash,
      expiresAt
    });

  return {
    ...invitation,
    token: rawToken
  };
}

/**
 * Accept an invitation.
 *
 * This operation creates the user,
 * role assignment and organization
 * membership atomically.
 */
async function acceptUserInvitation({
  token,
  firstName,
  lastName,
  password
}) {
  if (!token) throw new Error("INVITATION_TOKEN_REQUIRED");
  if (!firstName || !lastName) throw new Error("NAME_REQUIRED");
  if (!password) throw new Error("PASSWORD_REQUIRED");

  const tokenHash = hashInvitationToken(token);
  const passwordHash = await hashPassword(password);

  // The repository owns the transaction, role assignment, organization
  // membership, activity and audit. Use the same implementation for all.
  return invitationRepository.acceptInvitation({
    tokenHash,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    passwordHash
  });
}

/**
 * Check whether a user has the TEAM_LEAD role.
 */
async function isUserTeamLead(
  userId
) {
  const result = await pool.query(
    `
    SELECT 1
    FROM user_roles ur
    JOIN roles r
      ON r.id = ur.role_id
    WHERE ur.user_id = $1
      AND r.name = 'TEAM_LEAD'
      AND r.company_id IS NULL
      AND r.is_system = TRUE
    LIMIT 1
    `,
    [userId]
  );

  return result.rows.length > 0;
}

/**
 * Check whether a Team Lead actually
 * leads the specified organization unit.
 */
async function isTeamLeadOfOrganizationUnit(
  userId,
  organizationUnitId
) {
  const result = await pool.query(
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

module.exports = {
  createUserInvitation,
  acceptUserInvitation
};