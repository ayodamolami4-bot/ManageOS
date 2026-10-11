const pool = require("../db/database");

const {
  createActivityWithClient
} = require("./activityRepository");

const USER_SELECT = `
  SELECT
    u.id,
    u.company_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.country,
    u.timezone,
    u.job_title,
    u.avatar_url,
    u.last_login_at,
    u.created_at,
    u.updated_at,

    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', r.id,
            'name', r.name,
            'description', r.description,
            'is_system', r.is_system,
            'organization_unit_id', ur.organization_unit_id,
            'organization_unit_name', ou.name
          )
          ORDER BY r.name
        )
        FROM user_roles ur
        JOIN roles r
          ON r.id = ur.role_id
        LEFT JOIN organization_units ou
          ON ou.id = ur.organization_unit_id
        WHERE ur.user_id = u.id
      ),
      '[]'::jsonb
    ) AS roles,

    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', om.id,
            'organization_unit_id', ou.id,
            'organization_unit_name', ou.name,
            'organization_unit_type', ou.type,
            'parent_unit_id', ou.parent_unit_id
          )
          ORDER BY ou.name
        )
        FROM organization_memberships om
        JOIN organization_units ou
          ON ou.id = om.organization_unit_id
        WHERE om.user_id = u.id
      ),
      '[]'::jsonb
    ) AS memberships

  FROM users u
`;

async function getCompanyUsers(companyId) {
  const result = await pool.query(
    `
    ${USER_SELECT}
    WHERE u.company_id = $1
    ORDER BY u.created_at DESC
    `,
    [companyId]
  );

  return result.rows;
}

async function getUserByIdAndCompany(
  userId,
  companyId
) {
  const result = await pool.query(
    `
    ${USER_SELECT}
    WHERE u.id = $1
      AND u.company_id = $2
    LIMIT 1
    `,
    [userId, companyId]
  );

  return result.rows[0];
}

async function updateUserProfileWithClient(
  client,
  {
    companyId,
    userId,
    actorId,
    firstName,
    lastName,
    email,
    phone,
    country,
    timezone,
    jobTitle,
    avatarUrl
  }
) {
  try {
    await client.query("BEGIN");

    const existingResult = await client.query(
      `
      SELECT
        id,
        company_id,
        first_name,
        last_name,
        email,
        phone,
        country,
        timezone,
        job_title,
        avatar_url
      FROM users
      WHERE id = $1
        AND company_id = $2
      FOR UPDATE
      `,
      [userId, companyId]
    );

    const existingUser =
      existingResult.rows[0];

    if (!existingUser) {
      throw new Error("USER_NOT_FOUND");
    }

    const result = await client.query(
      `
      UPDATE users
      SET
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        country = $5,
        timezone = $6,
        job_title = $7,
        avatar_url = $8,
        updated_at = NOW()
      WHERE id = $9
        AND company_id = $10
      RETURNING
        id,
        company_id,
        first_name,
        last_name,
        email,
        phone,
        country,
        timezone,
        job_title,
        avatar_url,
        last_login_at,
        created_at,
        updated_at
      `,
      [
        firstName,
        lastName,
        email,
        phone,
        country,
        timezone,
        jobTitle,
        avatarUrl,
        userId,
        companyId
      ]
    );

    const updatedUser =
      result.rows[0];

    const oldValues = {
      first_name: existingUser.first_name,
      last_name: existingUser.last_name,
      email: existingUser.email,
      phone: existingUser.phone,
      country: existingUser.country,
      timezone: existingUser.timezone,
      job_title: existingUser.job_title,
      avatar_url: existingUser.avatar_url
    };

    const newValues = {
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      country: updatedUser.country,
      timezone: updatedUser.timezone,
      job_title: updatedUser.job_title,
      avatar_url: updatedUser.avatar_url
    };

    const changedFields = Object.keys(
      newValues
    ).filter(
      (field) =>
        oldValues[field] !==
        newValues[field]
    );

    await createActivityWithClient(
      client,
      {
        companyId,
        actorId,
        action: "USER_PROFILE_UPDATED",
        resourceType: "USER",
        resourceId: userId,
        metadata: {
          changed_fields: changedFields
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
        "USER_PROFILE_UPDATED",
        "USER",
        userId,
        oldValues,
        newValues,
        {
          changed_fields:
            changedFields
        }
      ]
    );

    await client.query("COMMIT");

    return updatedUser;
  } catch (error) {
    await client.query("ROLLBACK");

    if (
      error.code === "23505"
    ) {
      throw new Error(
        "EMAIL_ALREADY_IN_USE"
      );
    }

    throw error;
  }
}

async function getAssignableRoles(
  companyId
) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      name,
      description,
      is_system
    FROM roles
    WHERE company_id = $1
       OR (
         company_id IS NULL
         AND is_system = TRUE
       )
    ORDER BY
      is_system DESC,
      name ASC
    `,
    [companyId]
  );

  return result.rows;
}

async function assignUserRoleWithClient(
  client,
  {
    companyId,
    userId,
    roleId,
    organizationUnitId,
    assignedBy
  }
) {
  await client.query("BEGIN");

  try {
    const userResult = await client.query(
      `
      SELECT id
      FROM users
      WHERE id = $1
        AND company_id = $2
      LIMIT 1
      `,
      [userId, companyId]
    );

    if (!userResult.rows[0]) {
      throw new Error(
        "USER_NOT_FOUND"
      );
    }

    const roleResult = await client.query(
      `
      SELECT
        id,
        name,
        description,
        is_system,
        company_id
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
      [roleId, companyId]
    );

    const role = roleResult.rows[0];

    if (!role) {
      throw new Error(
        "ROLE_NOT_FOUND"
      );
    }

    if (
      role.name === "OWNER" &&
      organizationUnitId
    ) {
      throw new Error(
        "OWNER_ROLE_MUST_BE_COMPANY_WIDE"
      );
    }

    if (organizationUnitId) {
      const unitResult =
        await client.query(
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

      if (!unitResult.rows[0]) {
        throw new Error(
          "ORGANIZATION_UNIT_NOT_FOUND"
        );
      }
    }

    if (
      role.name === "OWNER"
    ) {
      const actorOwnerResult =
        await client.query(
          `
          SELECT 1
          FROM user_roles ur
          JOIN roles r
            ON r.id = ur.role_id
          JOIN users u
            ON u.id = ur.user_id
          WHERE ur.user_id = $1
            AND u.company_id = $2
            AND r.name = 'OWNER'
            AND r.company_id IS NULL
            AND r.is_system = TRUE
            AND ur.organization_unit_id IS NULL
          LIMIT 1
          `,
          [
            assignedBy,
            companyId
          ]
        );

      if (!actorOwnerResult.rows[0]) {
        throw new Error(
          "OWNER_ROLE_REQUIRES_OWNER"
        );
      }
    }

    let result;

    try {
      result = await client.query(
        `
        INSERT INTO user_roles (
          user_id,
          role_id,
          organization_unit_id,
          assigned_by
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
        `,
        [
          userId,
          roleId,
          organizationUnitId || null,
          assignedBy
        ]
      );
    } catch (error) {
      if (
        error.code === "23505"
      ) {
        throw new Error(
          "ROLE_ALREADY_ASSIGNED"
        );
      }

      throw error;
    }

    const assignment =
      result.rows[0];

    await createActivityWithClient(
      client,
      {
        companyId,
        actorId: assignedBy,
        action: "USER_ROLE_ASSIGNED",
        resourceType: "USER",
        resourceId: userId,
        metadata: {
          role_id: role.id,
          role_name: role.name,
          organization_unit_id:
            organizationUnitId || null
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
        assignedBy,
        "USER_ROLE_ASSIGNED",
        "USER",
        userId,
        null,
        {
          role_id: role.id,
          role_name: role.name,
          organization_unit_id:
            organizationUnitId || null
        },
        {
          role_assignment_id:
            assignment.id
        }
      ]
    );

    await client.query("COMMIT");

    return assignment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function removeUserRoleWithClient(
  client,
  {
    companyId,
    userId,
    roleId,
    organizationUnitId,
    removedBy
  }
) {
  await client.query("BEGIN");

  try {
    const result =
      await client.query(
        `
        SELECT
          ur.id,
          ur.user_id,
          ur.role_id,
          ur.organization_unit_id,
          r.name AS role_name,
          r.description AS role_description
        FROM user_roles ur
        JOIN roles r
          ON r.id = ur.role_id
        JOIN users u
          ON u.id = ur.user_id
        WHERE ur.user_id = $1
          AND ur.role_id = $2
          AND ur.organization_unit_id
              IS NOT DISTINCT FROM $3
          AND u.company_id = $4
        LIMIT 1
        FOR UPDATE
        `,
        [
          userId,
          roleId,
          organizationUnitId || null,
          companyId
        ]
      );

    const assignment =
      result.rows[0];

    if (!assignment) {
      throw new Error(
        "ROLE_ASSIGNMENT_NOT_FOUND"
      );
    }

    if (
      assignment.role_name ===
      "OWNER"
    ) {
      const ownerCountResult =
        await client.query(
          `
          SELECT COUNT(DISTINCT ur.user_id)::int AS count
          FROM user_roles ur
          JOIN roles r
            ON r.id = ur.role_id
          JOIN users u
            ON u.id = ur.user_id
          WHERE u.company_id = $1
            AND r.name = 'OWNER'
            AND r.company_id IS NULL
            AND r.is_system = TRUE
            AND ur.organization_unit_id IS NULL
          `,
          [companyId]
        );

      const ownerCount =
        ownerCountResult.rows[0]
          .count;

      if (ownerCount <= 1) {
        throw new Error(
          "CANNOT_REMOVE_LAST_OWNER"
        );
      }
    }

    await client.query(
      `
      DELETE FROM user_roles
      WHERE id = $1
      `,
      [assignment.id]
    );

    await createActivityWithClient(
      client,
      {
        companyId,
        actorId: removedBy,
        action: "USER_ROLE_REMOVED",
        resourceType: "USER",
        resourceId: userId,
        metadata: {
          role_id: assignment.role_id,
          role_name:
            assignment.role_name,
          organization_unit_id:
            assignment.organization_unit_id
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
        removedBy,
        "USER_ROLE_REMOVED",
        "USER",
        userId,
        {
          role_id:
            assignment.role_id,
          role_name:
            assignment.role_name,
          organization_unit_id:
            assignment.organization_unit_id,
          role_assignment_id:
            assignment.id
        },
        null,
        {}
      ]
    );

    await client.query("COMMIT");

    return assignment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

module.exports = {
  getCompanyUsers,
  getUserByIdAndCompany,
  updateUserProfileWithClient,
  getAssignableRoles,
  assignUserRoleWithClient,
  removeUserRoleWithClient
};