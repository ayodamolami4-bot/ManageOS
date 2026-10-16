const { loginUser, logoutUser } = require("../services/authService");
const {
  beginCompanyRegistration,
  verifyCompanyRegistration
} = require("../services/companyRegistrationService");

const SESSION_COOKIE_NAME =
  "session_id";

const SESSION_MAX_AGE =
  12 * 60 * 60 * 1000;

const isProduction =
  process.env.NODE_ENV ===
  "production";

const sessionCookieOptions = {
  httpOnly: true,

  /*
   * Development uses localhost over HTTP.
   * Production should run over HTTPS.
   */
  secure: isProduction,

  sameSite: "lax",

  path: "/",

  /*
   * Browser-side lifetime.
   * The server independently enforces
   * the 12-hour absolute timeout and
   * 30-minute idle timeout.
   */
  maxAge: SESSION_MAX_AGE
};

async function register(req, res) {
  res.set("Cache-Control", "no-store");
  try {
    const result = await beginCompanyRegistration(req.body);
    return res.status(202).json({
      data: result,
      message: "Check your email to activate your ManageOS company."
    });
  } catch (error) {
    const code = error.message;
    if (code === "REGISTRATION_EMAIL_IN_USE") {
      return res.status(409).json({
        error: { code, message: "This email is already registered. Please sign in." }
      });
    }
    if (code === "REGISTRATION_RETRY_LATER") {
      return res.status(429).json({
        error: { code, message: "A verification email was recently requested. Check your inbox or try again shortly." }
      });
    }
    if (["REGISTRATION_EMAIL_UNAVAILABLE", "REGISTRATION_EMAIL_DELIVERY_FAILED"].includes(code)) {
      console.error("Company verification email is unavailable.");
      return res.status(503).json({
        error: { code: "REGISTRATION_EMAIL_UNAVAILABLE",
          message: "Verification email could not be sent. Please try again later." }
      });
    }
    console.error("Company registration could not be started:", code);
    return res.status(500).json({
      error: { code: "REGISTRATION_FAILED", message: "Unable to start company registration." }
    });
  }
}

async function verifyCompany(req, res) {
  res.set("Cache-Control", "no-store");
  try {
    const result = await verifyCompanyRegistration(req.body.token);
    return res.status(201).json({
      data: result,
      message: "Email verified. Your company is ready. Sign in to ManageOS."
    });
  } catch (error) {
    if (error.message === "REGISTRATION_TOKEN_INVALID") {
      return res.status(400).json({
        error: { code: "REGISTRATION_TOKEN_INVALID",
          message: "This verification link is invalid, expired or already used." }
      });
    }
    if (error.message === "REGISTRATION_EMAIL_IN_USE") {
      return res.status(409).json({
        error: { code: "REGISTRATION_EMAIL_IN_USE",
          message: "An account already exists for this email." }
      });
    }
    console.error("Company activation failed:", error.message);
    return res.status(500).json({
      error: { code: "REGISTRATION_ACTIVATION_FAILED",
        message: "Unable to activate company. Please try again later." }
    });
  }
}

async function login(
  req,
  res
) {
  try {
    const result =
      await loginUser(
        req.body
      );

    res.cookie(
      SESSION_COOKIE_NAME,
      result.session.id,
      sessionCookieOptions
    );

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.status(200).json({
      data: result.user,
      message:
        "Login successful"
    });
  } catch (error) {
    console.error(
      "Login failed:",
      error
    );

    if (
      error.message ===
      "INVALID_CREDENTIALS"
    ) {
      return res.status(401).json({
        error: {
          code:
            "INVALID_CREDENTIALS",
          message:
            "Invalid email or password"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "LOGIN_FAILED",
        message:
          "Unable to login"
      }
    });
  }
}

async function logout(
  req,
  res
) {
  try {
    const sessionId =
      req.cookies?.[
        SESSION_COOKIE_NAME
      ];

    if (sessionId) {
      await logoutUser(
        sessionId
      );
    }

    res.clearCookie(
      SESSION_COOKIE_NAME,
      {
        httpOnly:
          sessionCookieOptions.httpOnly,
        secure:
          sessionCookieOptions.secure,
        sameSite:
          sessionCookieOptions.sameSite,
        path:
          sessionCookieOptions.path
      }
    );

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.status(200).json({
      message:
        "Logout successful"
    });
  } catch (error) {
    console.error(
      "Logout failed:",
      error
    );

    res.status(500).json({
      error: {
        code:
          "LOGOUT_FAILED",
        message:
          "Unable to logout"
      }
    });
  }
}

async function me(
  req,
  res
) {
  res.set(
    "Cache-Control",
    "no-store"
  );

  res.status(200).json({
    data: {
      user: req.user
    }
  });
}

module.exports = {
  register,
  verifyCompany,
  login,
  logout,
  me
};