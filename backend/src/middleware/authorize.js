const pool = require("../db/database");

function authorize(permissionName) {
  return async (req, res, next) => {
    try {
      const result = await pool.query(
        `
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        JOIN role_permissions rp ON rp.role_id = r.id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = $1
          AND p.name = $2
        LIMIT 1
        `,
        [req.user.id, permissionName]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to perform this action"
          }
        });
      }

      next();
    } catch (error) {
      console.error("Authorization failed:", error);

      res.status(500).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "Unable to verify permission"
        }
      });
    }
  };
}

module.exports = { authorize };