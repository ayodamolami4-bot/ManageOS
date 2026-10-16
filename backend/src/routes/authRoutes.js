const express = require("express");

const {
  register,
  verifyCompany,
  login,
  logout,
  me
} = require("../controllers/authController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const {
  validateBody
} = require("../middleware/validate");

const {
  registerCompanySchema,
  loginSchema
} = require("../validators/authSchemas");
const { verifyCompanyRegistrationSchema } = require("../validators/companyVerificationSchemas");

const {
  loginRateLimiter,
  registrationRateLimiter
} = require("../middleware/rateLimiters");

const {
  getCsrfToken
} = require("../middleware/csrfProtection");

const { forgotPassword, confirmPasswordReset } = require("../controllers/passwordRecoveryController");
const { forgotPasswordSchema, resetPasswordSchema } = require("../validators/passwordRecoverySchemas");
const { passwordRecoveryRateLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

/*
 * Get a CSRF token for state-changing
 * requests.
 */
router.get(
  "/csrf",
  getCsrfToken
);

router.post(
  "/register/company",
  registrationRateLimiter,
  validateBody(
    registerCompanySchema
  ),
  register
);

router.post(
  "/verify-company",
  registrationRateLimiter,
  validateBody(verifyCompanyRegistrationSchema),
  verifyCompany
);

router.post(
  "/login",
  loginRateLimiter,
  validateBody(
    loginSchema
  ),
  login
);

router.post(
  "/logout",
  logout
);

router.get(
  "/me",
  authenticate,
  me
);

router.post("/forgot-password",
  passwordRecoveryRateLimiter, validateBody(forgotPasswordSchema), forgotPassword);
router.post("/reset-password",
  passwordRecoveryRateLimiter, validateBody(resetPasswordSchema), confirmPasswordReset);

module.exports = router;