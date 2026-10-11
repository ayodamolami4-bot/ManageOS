const pool = require("../db/database");

const {
  createActivityWithClient
} = require("./activityRepository");

async function createOrganizationMembership({
  userId,
  organizationUnitId
}) {
  const result = await pool.query(
    `
    INSERT INTO organization_memberships (
      user_id,
      organization_unit_id
    )
    VALUES ($1, $2)
    RETURNING *
    `,
    [
      userId,
      organizationUnitId
    ]
  );

  return result.rows[0];
}

async function createOrganizationMembershipWithAudit(
  {
    userId,
    organizationUnitId,
    companyId,
    actorId
  }
) {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    const result =
      await client.query(
        `
        INSERT INTO organization_memberships (
          user_id,
          organization_unit_id
        )
        VALUES ($1, $2)
        RETURNING *
        `,
        [
          userId,
          organizationUnitId
        ]
      );

    const membership =
      result.rows[0];

    await createActivityWithClient(
      client,
      {
        companyId,
        actorId,
        action:
          "USER_ADDED_TO_ORGANIZATION_UNIT",
        resourceType: "USER",
        resourceId: userId,
        metadata: {
          organization_membership_id:
            membership.id,
          organization_unit_id:
            organizationUnitId
        }
      }
    );

    await client.query(
      `
      INSERT INTO audit_logs (
        company_id,
        actor_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        metadata
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8
      )
      `,
      [
        companyId,
        actorId,
        "USER_ADDED_TO_ORGANIZATION_UNIT",
        "USER",
        userId,
        null,
        {
          organization_membership_id:
            membership.id,
          organization_unit_id:
            organizationUnitId
        },
        {}
      ]
    );

    await client.query(
      "COMMIT"
    );

    return membership;
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    if (
      error.code === "23505"
    ) {
      throw new Error(
        "MEMBERSHIP_ALREADY_EXISTS"
      );
    }

    throw error;
  } finally {
    client.release();
  }
}

async function getUserOrganizationMemberships(
  userId
) {
  const result = await pool.query(
    `
    SELECT
      om.id,
      om.user_id,
      om.organization_unit_id,
      ou.name AS organization_unit_name,
      ou.type AS organization_unit_type,
      ou.parent_unit_id,
      om.created_at,
      om.updated_at
    FROM organization_memberships om
    JOIN organization_units ou
      ON ou.id = om.organization_unit_id
    WHERE om.user_id = $1
    ORDER BY ou.name ASC
    `,
    [userId]
  );

  return result.rows;
}

async function getUserByIdAndCompany(
  userId,
  companyId
) {
  const result = await pool.query(
    `
    SELECT id
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

  return result.rows[0];
}

async function getOrganizationUnitByIdAndCompany(
  organizationUnitId,
  companyId
) {
  const result = await pool.query(
    `
    SELECT id
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

  return result.rows[0];
}

async function deleteOrganizationMembershipWithAudit(
  {
    membershipId,
    companyId,
    actorId
  }
) {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    const membershipResult =
      await client.query(
        `
        SELECT
          om.id,
          om.user_id,
          om.organization_unit_id,
          ou.name AS organization_unit_name,
          u.company_id
        FROM organization_memberships om
        JOIN organization_units ou
          ON ou.id = om.organization_unit_id
        JOIN users u
          ON u.id = om.user_id
        WHERE om.id = $1
          AND u.company_id = $2
        LIMIT 1
        FOR UPDATE
        `,
        [
          membershipId,
          companyId
        ]
      );

    const membership =
      membershipResult.rows[0];

    if (!membership) {
      throw new Error(
        "MEMBERSHIP_NOT_FOUND"
      );
    }

    await client.query(
      `
      DELETE FROM organization_memberships
      WHERE id = $1
      `,
      [membershipId]
    );

    await createActivityWithClient(
      client,
      {
        companyId,
        actorId,
        action:
          "USER_REMOVED_FROM_ORGANIZATION_UNIT",
        resourceType: "USER",
        resourceId:
          membership.user_id,
        metadata: {
          organization_membership_id:
            membership.id,
          organization_unit_id:
            membership.organization_unit_id,
          organization_unit_name:
            membership.organization_unit_name
        }
      }
    );

    await client.query(
      `
      INSERT INTO audit_logs (
        company_id,
        actor_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        metadata
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8
      )
      `,
      [
        companyId,
        actorId,
        "USER_REMOVED_FROM_ORGANIZATION_UNIT",
        "USER",
        membership.user_id,
        {
          organization_membership_id:
            membership.id,
          organization_unit_id:
            membership.organization_unit_id,
          organization_unit_name:
            membership.organization_unit_name
        },
        null,
        {}
      ]
    );

    await client.query(
      "COMMIT"
    );

    return membership;
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}


async function getOrganizationMembershipsForUser(userId, companyId) {
  const result = await pool.query(
    `SELECT om.id, om.user_id, om.organization_unit_id,
            ou.name AS organization_unit_name, ou.type AS organization_unit_type,
            ou.parent_unit_id, om.created_at, om.updated_at
     FROM organization_memberships om
     JOIN users u ON u.id = om.user_id
     JOIN organization_units ou ON ou.id = om.organization_unit_id
     WHERE om.user_id = $1 AND u.company_id = $2 AND ou.company_id = $2
     ORDER BY ou.name ASC`,
    [userId, companyId]
  );
  return result.rows;
}

async function getOrganizationMembershipById(membershipId, companyId) {
  const result = await pool.query(
    `SELECT om.id, om.user_id, om.organization_unit_id
     FROM organization_memberships om
     JOIN users u ON u.id = om.user_id
     JOIN organization_units ou ON ou.id = om.organization_unit_id
     WHERE om.id = $1 AND u.company_id = $2 AND ou.company_id = $2
     LIMIT 1`,
    [membershipId, companyId]
  );
  return result.rows[0] || null;
}

module.exports = {
  createOrganizationMembership,
  createOrganizationMembershipWithAudit,
  getUserOrganizationMemberships,
  getOrganizationMembershipsForUser,
  getOrganizationMembershipById,
  getUserByIdAndCompany,
  getOrganizationUnitByIdAndCompany,
  deleteOrganizationMembershipWithAudit
};