const crypto = require("crypto");

const CSRF_COOKIE_NAME =
  "csrf_token";

const CSRF_TOKEN_LENGTH = 32;

const isProduction =
  process.env.NODE_ENV ===
  "production";

const csrfCookieOptions = {
  httpOnly: true,

  secure: isProduction,

  sameSite: "lax",

  path: "/",

  maxAge:
    12 * 60 * 60 * 1000
};

function generateCsrfToken() {
  return crypto.randomBytes(
    CSRF_TOKEN_LENGTH
  ).toString("hex");
}

function setCsrfCookie(
  res,
  token
) {
  res.cookie(
    CSRF_COOKIE_NAME,
    token,
    csrfCookieOptions
  );
}

function ensureCsrfToken(
  req,
  res
) {
  const existingToken =
    req.cookies?.[
      CSRF_COOKIE_NAME
    ] || req._manageosGeneratedCsrfToken;

  if (existingToken) {
    return existingToken;
  }

  const token =
    generateCsrfToken();

  // The global GET middleware and /auth/csrf handler run on the same
  // request. Reuse this token instead of emitting two conflicting cookies.
  req._manageosGeneratedCsrfToken = token;

  setCsrfCookie(
    res,
    token
  );

  return token;
}

function tokensMatch(
  cookieToken,
  headerToken
) {
  if (
    !cookieToken ||
    !headerToken
  ) {
    return false;
  }

  const cookieBuffer =
    Buffer.from(
      String(cookieToken)
    );

  const headerBuffer =
    Buffer.from(
      String(headerToken)
    );

  if (
    cookieBuffer.length !==
    headerBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    cookieBuffer,
    headerBuffer
  );
}

function csrfProtection(
  req,
  res,
  next
) {
  /*
   * Safe methods do not change application
   * state, so they don't require a CSRF header.
   *
   * OPTIONS must remain available for CORS
   * preflight requests when the frontend is
   * integrated later.
   */
  const safeMethods = [
    "GET",
    "HEAD",
    "OPTIONS"
  ];

  if (
    safeMethods.includes(
      req.method
    )
  ) {
    ensureCsrfToken(
      req,
      res
    );

    return next();
  }

  const cookieToken =
    req.cookies?.[
      CSRF_COOKIE_NAME
    ];

  const headerToken =
    req.get("X-CSRF-Token");

  if (
    !tokensMatch(
      cookieToken,
      headerToken
    )
  ) {
    return res.status(403).json({
      error: {
        code:
          "CSRF_TOKEN_INVALID",
        message:
          "CSRF token is missing or invalid"
      }
    });
  }

  next();
}

function getCsrfToken(
  req,
  res
) {
  const token =
    ensureCsrfToken(
      req,
      res
    );

  res.set(
    "Cache-Control",
    "no-store"
  );

  res.status(200).json({
    data: {
      csrfToken: token
    },
    message:
      "CSRF token retrieved successfully"
  });
}

module.exports = {
  csrfProtection,
  getCsrfToken
};