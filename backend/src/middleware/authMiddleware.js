const pool =
  require("../db/database");

const SESSION_COOKIE_NAME =
  "session_id";

async function authenticate(
  req,
  res,
  next
) {
  try {
    const sessionId =
      req.cookies?.[
        SESSION_COOKIE_NAME
      ];

    if (!sessionId) {
      return res.status(401).json({
        error: {
          code:
            "NOT_AUTHENTICATED",
          message:
            "Authentication required"
        }
      });
    }

    /*
     * Authenticate and refresh last_seen_at
     * in one database operation.
     *
     * Security rules:
     *
     * 1. Session must not be expired.
     *
     * 2. Session must be less than
     *    12 hours old.
     *
     * 3. Session must have been used
     *    within the last 30 minutes.
     *
     * last_seen_at is updated only after
     * all three checks pass.
     */
    const result =
      await pool.query(
        `
        UPDATE sessions
        SET last_seen_at = NOW()
        FROM users
        WHERE sessions.id = $1

          AND users.id =
              sessions.user_id

          AND sessions.expires_at >
              NOW()

          AND sessions.created_at >
              NOW() - INTERVAL '12 hours'

          AND sessions.last_seen_at >
              NOW() - INTERVAL '30 minutes'

        RETURNING
          sessions.id AS session_id,
          sessions.expires_at,
          sessions.created_at,
          sessions.last_seen_at,
          users.id,
          users.company_id,
          users.first_name,
          users.last_name,
          users.email
        `,
        [
          sessionId
        ]
      );

    const user =
      result.rows[0];

    /*
     * No row means one of the security
     * conditions failed:
     *
     * - invalid session
     * - expired session
     * - absolute timeout reached
     * - idle timeout reached
     */
    if (!user) {
      /*
       * Remove the server-side session.
       *
       * This means an expired/idle session
       * cannot become valid again.
       */
      await pool.query(
        `
        DELETE FROM sessions
        WHERE id = $1
        `,
        [sessionId]
      );

      /*
       * Remove the browser cookie as well.
       */
      res.clearCookie(
        SESSION_COOKIE_NAME,
        {
          httpOnly: true,
          secure:
            process.env.NODE_ENV ===
            "production",
          sameSite: "lax",
          path: "/"
        }
      );

      return res.status(401).json({
        error: {
          code:
            "INVALID_SESSION",
          message:
            "Session is invalid or expired"
        }
      });
    }

    /*
     * Only safe user information is
     * placed on req.user.
     *
     * The password hash is never exposed.
     */
    req.user = {
      id: user.id,
      company_id:
        user.company_id,
      first_name:
        user.first_name,
      last_name:
        user.last_name,
      email:
        user.email
    };

    req.sessionId =
      user.session_id;

    next();
  } catch (error) {
    console.error(
      "Authentication failed:",
      error
    );

    return res.status(500).json({
      error: {
        code:
          "AUTHENTICATION_FAILED",
        message:
          "Unable to authenticate request"
      }
    });
  }
}

module.exports = {
  authenticate
};