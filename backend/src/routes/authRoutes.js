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
  registrationRateLimiter,
  companyVerificationRateLimiter
} = require("../middleware/rateLimiters");

const {
  getCsrfToken
} = require("../middleware/csrfProtection");

const { forgotPassword, confirmPasswordReset } = require("../controllers/passwordRecoveryController");
const { forgotPasswordSchema, resetPasswordSchema } = require("../validators/passwordRecoverySchemas");
const { passwordRecoveryRateLimiter } = require("../middleware/rateLimiters");

const { confirm } = require("../controllers/emailChangeController");
const { confirmEmailChangeSchema } = require("../validators/emailChangeSchemas");
const { rateLimit } = require("express-rate-limit");
const emailConfirmLimiter = rateLimit({
  windowMs:15*60*1000,limit:20,standardHeaders:"draft-8",legacyHeaders:false,
  message:{error:{code:"EMAIL_CONFIRM_RATE_LIMITED",message:"Too many attempts. Try again later."}}
});

const router = express.Router();

router.post("/confirm-email-change",
  emailConfirmLimiter,validateBody(confirmEmailChangeSchema),confirm);

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
  companyVerificationRateLimiter,
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