const {
  canViewGoal,
  canManageGoal
} = require("../services/authorizationService");

async function requireGoalView(
  req,
  res,
  next
) {
  try {
    const allowed =
      await canViewGoal(req.user);

    if (!allowed) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message:
            "You do not have permission to view company goals"
        }
      });
    }

    next();
  } catch (error) {
    console.error(
      "Goal view authorization failed:",
      error
    );

    res.status(500).json({
      error: {
        code:
          "AUTHORIZATION_FAILED",
        message:
          "Unable to verify goal access"
      }
    });
  }
}

async function requireGoalManagement(
  req,
  res,
  next
) {
  try {
    const allowed =
      await canManageGoal(
        req.user
      );

    if (!allowed) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message:
            "You do not have permission to manage company goals"
        }
      });
    }

    next();
  } catch (error) {
    console.error(
      "Goal management authorization failed:",
      error
    );

    res.status(500).json({
      error: {
        code:
          "AUTHORIZATION_FAILED",
        message:
          "Unable to verify goal management access"
      }
    });
  }
}

module.exports = {
  requireGoalView,
  requireGoalManagement
};