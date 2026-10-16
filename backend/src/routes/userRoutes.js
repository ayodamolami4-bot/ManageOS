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

const { request } = require("../controllers/emailChangeController");
const { requestEmailChangeSchema } = require("../validators/emailChangeSchemas");
const { rateLimit } = require("express-rate-limit");
const emailChangeLimiter = rateLimit({
  windowMs:15*60*1000,limit:5,standardHeaders:"draft-8",legacyHeaders:false,
  message:{error:{code:"EMAIL_CHANGE_RATE_LIMITED",message:"Too many attempts. Try again later."}}
});

const router = express.Router();

router.post("/me/email-change",
  authenticate,emailChangeLimiter,validateBody(requestEmailChangeSchema),request);

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