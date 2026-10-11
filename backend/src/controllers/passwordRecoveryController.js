const { requestPasswordReset, resetPassword } = require("../services/passwordRecoveryService");

async function forgotPassword(req, res) {
  try {
    await requestPasswordReset(req.body.email);
    res.set("Cache-Control", "no-store");
    return res.status(200).json({
      message: "If an account exists for this address, reset instructions will be sent.",
    });
  } catch (error) {
    if (["EMAIL_NOT_CONFIGURED", "EMAIL_DELIVERY_FAILED"].includes(error.message)) {
      return res.status(503).json({
        error: {
          code: "PASSWORD_RESET_UNAVAILABLE",
          message: "Password recovery email is temporarily unavailable. Please try again later.",
        },
      });
    }
    console.error("Password reset request failed:", error);
    return res.status(500).json({
      error: { code: "PASSWORD_RESET_REQUEST_FAILED", message: "Unable to process password reset." },
    });
  }
}

async function confirmPasswordReset(req, res) {
  try {
    await resetPassword(req.body.token, req.body.password);
    res.set("Cache-Control", "no-store");
    return res.status(200).json({ message: "Password updated. Sign in with your new password." });
  } catch (error) {
    if (error.message === "PASSWORD_RESET_TOKEN_INVALID") {
      return res.status(400).json({
        error: { code: "PASSWORD_RESET_TOKEN_INVALID", message: "This reset link is invalid or has expired." },
      });
    }
    console.error("Password reset failed:", error);
    return res.status(500).json({
      error: { code: "PASSWORD_RESET_FAILED", message: "Unable to reset password." },
    });
  }
}

module.exports = { forgotPassword, confirmPasswordReset };
