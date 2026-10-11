const {
  registerCompany,
  loginUser,
  logoutUser
} = require("../services/authService");

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

async function register(
  req,
  res
) {
  try {
    const result =
      await registerCompany(
        req.body
      );

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.status(201).json({
      data: result,
      message:
        "Company registered successfully"
    });
  } catch (error) {
    console.error(
      "Registration failed:",
      error
    );

    res.status(500).json({
      error: {
        code:
          "REGISTRATION_FAILED",
        message:
          "Unable to register company"
      }
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
  login,
  logout,
  me
};