const {
  rateLimit
} = require("express-rate-limit");

/*
 * Login protection.
 *
 * Limits repeated authentication attempts
 * from the same IP address.
 */
const loginRateLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 10,

    standardHeaders:
      "draft-8",

    legacyHeaders: false,

    message: {
      error: {
        code:
          "AUTH_RATE_LIMITED",
        message:
          "Too many login attempts. Please try again later."
      }
    }
  });

/*
 * Company registration protection.
 *
 * Registration is more expensive than a
 * normal request because it creates a company
 * and its first user.
 */
const registrationRateLimiter =
  rateLimit({
    windowMs:
      60 * 60 * 1000,

    limit: 5,

    standardHeaders:
      "draft-8",

    legacyHeaders: false,

    message: {
      error: {
        code:
          "REGISTRATION_RATE_LIMITED",
        message:
          "Too many registration attempts. Please try again later."
      }
    }
  });

module.exports = {
  loginRateLimiter,
  registrationRateLimiter
};