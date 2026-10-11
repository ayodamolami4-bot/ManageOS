const pool = require("../db/database");

const {
  createActivityWithClient
} = require("./activityRepository");

async function createInvitation({
  companyId,
  email,
  invitedBy,
  roleId,
  organizationUnitId,
  tokenHash,
  expiresAt
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      INSERT INTO invitations (
        company_id,
        email,
        invited_by,
        role_id,
        organization_unit_id,
        token_hash,
        expires_at
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7
      )
      RETURNING
        id,
        company_id,
        email,
        invited_by,
        role_id,
        organization_unit_id,
        status,
        expires_at,
        created_at
      `,
      [
        companyId,
        email,
        invitedBy,
        roleId,
        organizationUnitId || null,
        tokenHash,
        expiresAt
      ]
    );

    const invitation =
      result.rows[0];

    await createActivityWithClient(
      client,
      {
        companyId,
        actorId: invitedBy,
        action: "USER_INVITATION_CREATED",
        resourceType: "INVITATION",
        resourceId: invitation.id,
        metadata: {
          email,
          role_id: roleId,
          organization_unit_id:
            organizationUnitId || null,
          expires_at: expiresAt
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
        invitedBy,
        "USER_INVITATION_CREATED",
        "INVITATION",
        invitation.id,
        null,
        {
          email,
          role_id: roleId,
          organization_unit_id:
            organizationUnitId || null,
          status: "PENDING",
          expires_at: expiresAt
        },
        {}
      ]
    );

    await client.query("COMMIT");

    return { invitation };
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      throw new Error(
        "PENDING_INVITATION_EXISTS"
      );
    }

    throw error;
  } finally {
    client.release();
  }
}

async function getInvitationByTokenHashWithClient(
  client,
  tokenHash
) {
  const result = await client.query(
    `
    SELECT
      i.id,
      i.company_id,
      i.email,
      i.invited_by,
      i.role_id,
      i.organization_unit_id,
      i.status,
      i.expires_at,
      i.created_at
    FROM invitations i
    WHERE i.token_hash = $1
    LIMIT 1
    FOR UPDATE
    `,
    [tokenHash]
  );

  return result.rows[0];
}

async function acceptInvitation({
  tokenHash,
  firstName,
  lastName,
  passwordHash
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const invitation =
      await getInvitationByTokenHashWithClient(
        client,
        tokenHash
      );

    if (!invitation) {
      throw new Error(
        "INVITATION_NOT_FOUND"
      );
    }

    if (
      invitation.status !== "PENDING"
    ) {
      throw new Error(
        "INVITATION_NOT_ACTIVE"
      );
    }

    if (
      new Date(invitation.expires_at) <=
      new Date()
    ) {
      await client.query(
        `
        UPDATE invitations
        SET status = 'REVOKED',
            revoked_at = NOW()
        WHERE id = $1
        `,
        [invitation.id]
      );

      throw new Error(
        "INVITATION_EXPIRED"
      );
    }

    const existingUserResult =
      await client.query(
        `
        SELECT id
        FROM users
        WHERE company_id = $1
          AND LOWER(email) = LOWER($2)
        LIMIT 1
        `,
        [
          invitation.company_id,
          invitation.email
        ]
      );

    if (
      existingUserResult.rows[0]
    ) {
      throw new Error(
        "USER_ALREADY_EXISTS"
      );
    }

    const userResult =
      await client.query(
        `
        INSERT INTO users (
          company_id,
          first_name,
          last_name,
          email,
          password_hash
        )
        VALUES (
          $1, $2, $3, $4, $5
        )
        RETURNING
          id,
          company_id,
          first_name,
          last_name,
          email,
          created_at
        `,
        [
          invitation.company_id,
          firstName,
          lastName,
          invitation.email,
          passwordHash
        ]
      );

    const user =
      userResult.rows[0];

    await client.query(
      `
      INSERT INTO user_roles (
        user_id,
        role_id,
        organization_unit_id,
        assigned_by
      )
      VALUES (
        $1, $2, $3, $4
      )
      `,
      [
        user.id,
        invitation.role_id,
        invitation.organization_unit_id,
        invitation.invited_by
      ]
    );

    if (
      invitation.organization_unit_id
    ) {
      await client.query(
        `
        INSERT INTO organization_memberships (
          user_id,
          organization_unit_id
        )
        VALUES ($1, $2)
        `,
        [
          user.id,
          invitation.organization_unit_id
        ]
      );
    }

    await client.query(
      `
      UPDATE invitations
      SET
        status = 'ACCEPTED',
        accepted_user_id = $1,
        accepted_at = NOW()
      WHERE id = $2
      `,
      [
        user.id,
        invitation.id
      ]
    );

    await createActivityWithClient(
      client,
      {
        companyId:
          invitation.company_id,
        actorId: user.id,
        action:
          "USER_INVITATION_ACCEPTED",
        resourceType: "USER",
        resourceId: user.id,
        metadata: {
          invitation_id:
            invitation.id,
          role_id:
            invitation.role_id,
          organization_unit_id:
            invitation.organization_unit_id
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
        invitation.company_id,
        user.id,
        "USER_INVITATION_ACCEPTED",
        "USER",
        user.id,
        {
          invitation_id:
            invitation.id,
          invitation_status:
            "PENDING"
        },
        {
          invitation_id:
            invitation.id,
          invitation_status:
            "ACCEPTED",
          email:
            invitation.email,
          role_id:
            invitation.role_id,
          organization_unit_id:
            invitation.organization_unit_id
        },
        {}
      ]
    );

    await client.query("COMMIT");

    return {
      user,
      invitation
    };
  } catch (error) {
    await client.query("ROLLBACK");

    if (
      error.code === "23505"
    ) {
      throw new Error(
        "USER_ALREADY_EXISTS"
      );
    }

    throw error;
  } finally {
    client.release();
  }
}


/**
 * A failed delivery must not leave a pending invitation that blocks retry.
 * The raw bearer token remains inaccessible and cannot be accepted.
 */
async function revokeUndeliveredInvitation({ invitationId, companyId, actorId }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE invitations SET status = 'REVOKED', revoked_at = NOW()
       WHERE id = $1 AND company_id = $2 AND status = 'PENDING'
       RETURNING id`,
      [invitationId, companyId]
    );
    if (result.rows.length) {
      await client.query(
        `INSERT INTO audit_logs
         (company_id, actor_id, action, resource_type, resource_id, metadata)
         VALUES ($1, $2, 'USER_INVITATION_DELIVERY_FAILED', 'INVITATION', $3, $4)`,
        [companyId, actorId, invitationId, { delivery: "failed" }]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createInvitation,
  acceptInvitation,
  revokeUndeliveredInvitation
};