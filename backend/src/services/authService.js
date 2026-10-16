const pool =
  require("../db/database");

const {
  verifyPassword
} = require("../utils/password");

/*
 * Normalize email consistently so that
 * login and registration behave predictably.
 */
function normalizeEmail(
  email
) {
  return String(
    email || ""
  )
    .trim()
    .toLowerCase();
}

async function loginUser({
  email,
  password
}) {
  const normalizedEmail =
    normalizeEmail(email);

  if (
    !normalizedEmail ||
    !password
  ) {
    throw new Error(
      "INVALID_CREDENTIALS"
    );
  }

  /*
   * Use the same generic error for
   * unknown email and wrong password.
   */
  const result =
    await pool.query(
      `
      SELECT
        users.id,
        users.company_id,
        companies.name AS company_name,
        users.first_name,
        users.last_name,
        users.email,
        (
                    SELECT COALESCE(
                      jsonb_agg(jsonb_build_object(
                        'name', r.name,
                        'organization_unit_id', ur.organization_unit_id
                      ) ORDER BY r.name),
                      '[]'::jsonb
                    )
                    FROM user_roles ur
                    JOIN roles r ON r.id = ur.role_id
                    WHERE ur.user_id = users.id
                  ) AS roles,
        (
          SELECT COALESCE(jsonb_agg(DISTINCT p.name ORDER BY p.name), '[]'::jsonb)
          FROM user_roles ur
          JOIN role_permissions rp ON rp.role_id = ur.role_id
          JOIN permissions p ON p.id = rp.permission_id
          WHERE ur.user_id = users.id
        ) AS permissions,
        password_hash
      FROM users
      JOIN companies ON companies.id = users.company_id
      WHERE users.email = $1
      LIMIT 1
      `,
      [
        normalizedEmail
      ]
    );

  const user =
    result.rows[0];

  if (!user) {
    throw new Error(
      "INVALID_CREDENTIALS"
    );
  }

  const passwordValid =
    await verifyPassword(
      password,
      user.password_hash
    );

  if (!passwordValid) {
    throw new Error(
      "INVALID_CREDENTIALS"
    );
  }

  /*
   * Absolute session lifetime:
   * 12 hours from creation.
   *
   * last_seen_at already defaults to NOW()
   * in the database.
   */
  const sessionResult =
    await pool.query(
      `
      INSERT INTO sessions (
        user_id,
        expires_at
      )
      VALUES (
        $1,
        NOW() + INTERVAL '12 hours'
      )
      RETURNING
        id,
        expires_at,
        created_at,
        last_seen_at
      `,
      [
        user.id
      ]
    );

  const session =
    sessionResult.rows[0];

  return {
    user: {
      id: user.id,
      company_id:
        user.company_id,
      company_name: user.company_name,
      first_name:
        user.first_name,
      last_name:
        user.last_name,
      email:
        user.email,
      roles: user.roles || [],
      permissions: user.permissions || []
    },

    session
  };
}

async function logoutUser(
  sessionId
) {
  if (!sessionId) {
    return;
  }

  await pool.query(
    `
    DELETE FROM sessions
    WHERE id = $1
    `,
    [sessionId]
  );
}

module.exports = {
  loginUser,
  logoutUser
};