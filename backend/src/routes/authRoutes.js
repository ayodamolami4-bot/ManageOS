const express = require("express");

const {
  register,
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

const {
  loginRateLimiter,
  registrationRateLimiter
} = require("../middleware/rateLimiters");

const {
  getCsrfToken
} = require("../middleware/csrfProtection");

const router =
  express.Router();

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

module.exports = router;