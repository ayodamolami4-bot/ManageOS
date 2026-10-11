const express =
  require("express");

const {
  getCompanyUsers,
  getUserById,
  updateUserById,
  getAvailableRoles,
  assignUserRole,
  removeUserRole
} = require(
  "../controllers/userController"
);

const {
  authenticate
} = require(
  "../middleware/authMiddleware"
);

const {
  validateBody,
  validateParams,
  validateQuery
} = require(
  "../middleware/validate"
);

const {
  userIdParamSchema,
  roleAssignmentParamsSchema,
  removeRoleParamsSchema,
  updateUserSchema,
  assignUserRoleSchema,
  removeUserRoleQuerySchema
} = require(
  "../validators/userSchemas"
);

const router =
  express.Router();

router.get(
  "/",
  authenticate,
  getCompanyUsers
);

router.get(
  "/roles",
  authenticate,
  getAvailableRoles
);

router.get(
  "/:userId",
  authenticate,
  validateParams(
    userIdParamSchema
  ),
  getUserById
);

router.put(
  "/:userId",
  authenticate,
  validateParams(
    userIdParamSchema
  ),
  validateBody(
    updateUserSchema
  ),
  updateUserById
);

router.post(
  "/:userId/roles",
  authenticate,
  validateParams(
    roleAssignmentParamsSchema
  ),
  validateBody(
    assignUserRoleSchema
  ),
  assignUserRole
);

router.delete(
  "/:userId/roles/:roleId",
  authenticate,
  validateParams(
    removeRoleParamsSchema
  ),
  validateQuery(
    removeUserRoleQuerySchema
  ),
  removeUserRole
);

module.exports = router;