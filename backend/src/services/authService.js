const pool =
  require("../db/database");

const {
  hashPassword,
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

async function registerCompany({
  companyName,
  firstName,
  lastName,
  email,
  password
}) {
  const normalizedEmail =
    normalizeEmail(email);

  if (
    !companyName ||
    !firstName ||
    !lastName ||
    !normalizedEmail ||
    !password
  ) {
    throw new Error(
      "INVALID_REGISTRATION_DATA"
    );
  }

  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    /*
     * 1. Create company.
     */
    const companyResult =
      await client.query(
        `
        INSERT INTO companies (
          name
        )
        VALUES ($1)
        RETURNING
          id,
          name,
          created_at
        `,
        [
          companyName.trim()
        ]
      );

    const company =
      companyResult.rows[0];

    /*
     * 2. Hash password.
     */
    const passwordHash =
      await hashPassword(
        password
      );

    /*
     * 3. Create first user.
     */
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
          $1,
          $2,
          $3,
          $4,
          $5
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
          company.id,
          firstName.trim(),
          lastName.trim(),
          normalizedEmail,
          passwordHash
        ]
      );

    const user =
      userResult.rows[0];

    /*
     * 4. Find system OWNER role.
     */
    const roleResult =
      await client.query(
        `
        SELECT id
        FROM roles
        WHERE name = 'OWNER'
          AND company_id IS NULL
          AND is_system = TRUE
        LIMIT 1
        `
      );

    const ownerRole =
      roleResult.rows[0];

    if (!ownerRole) {
      throw new Error(
        "System OWNER role not found"
      );
    }

    /*
     * 5. Assign OWNER role.
     */
    await client.query(
      `
      INSERT INTO user_roles (
        user_id,
        role_id,
        assigned_by
      )
      VALUES (
        $1,
        $2,
        $1
      )
      `,
      [
        user.id,
        ownerRole.id
      ]
    );

    await client.query(
      "COMMIT"
    );

    return {
      company,
      user
    };
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
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
  registerCompany,
  loginUser,
  logoutUser
};