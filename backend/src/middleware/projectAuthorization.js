const {
  canViewProject,
  canManageProject,
  canLinkProjectOrganizationUnit
} = require("../services/authorizationService");

async function requireProjectView(
  req,
  res,
  next
) {
  try {
    const allowed =
      await canViewProject(
        req.user,
        req.params.projectId
      );

    if (!allowed) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message:
            "You do not have access to this project"
        }
      });
    }

    next();
  } catch (error) {
    console.error(
      "Project view authorization failed:",
      error
    );

    res.status(500).json({
      error: {
        code: "AUTHORIZATION_FAILED",
        message:
          "Unable to verify project access"
      }
    });
  }
}

async function requireProjectManagement(
  req,
  res,
  next
) {
  try {
    const allowed =
      await canManageProject(
        req.user,
        req.params.projectId
      );

    if (!allowed) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message:
            "You do not have permission to manage this project"
        }
      });
    }

    next();
  } catch (error) {
    console.error(
      "Project management authorization failed:",
      error
    );

    res.status(500).json({
      error: {
        code: "AUTHORIZATION_FAILED",
        message:
          "Unable to verify project access"
      }
    });
  }
}

async function requireProjectUnitLinkManagement(req, res, next) {
  try {
    if (!(await canLinkProjectOrganizationUnit(req.user, req.params.projectId))) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only Owners and company-wide Managers can link organization units to this project"
        }
      });
    }
    next();
  } catch (error) {
    console.error("Project organization scope authorization failed:", error);
    res.status(500).json({
      error: {
        code: "AUTHORIZATION_FAILED",
        message: "Unable to verify project organization scope access"
      }
    });
  }
}

module.exports = {
  requireProjectView,
  requireProjectManagement,
  requireProjectUnitLinkManagement
};