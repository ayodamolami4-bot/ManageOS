const {
  canCreateProject
} = require("../services/authorizationService");

async function requireProjectCreation(
  req,
  res,
  next
) {
  try {
    const allowed =
      await canCreateProject(
        req.user
      );

    if (!allowed) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message:
            "You do not have permission to create a project"
        }
      });
    }

    next();
  } catch (error) {
    console.error(
      "Project creation authorization failed:",
      error
    );

    res.status(500).json({
      error: {
        code: "AUTHORIZATION_FAILED",
        message:
          "Unable to verify project creation access"
      }
    });
  }
}

module.exports = {
  requireProjectCreation
};