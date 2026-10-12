const express = require("express");

const { createOrganizationUnit, getOrganizationUnits } = require("../controllers/organizationUnitController");
const { authenticate } = require("../middleware/authMiddleware");
const { canManageOrganizationUnit } = require("../services/authorizationService");

const { validateBody } = require("../middleware/validate");
const { createOrganizationUnitSchema } = require("../validators/organizationUnitSchemas");

const router = express.Router();

async function requireCompanyStructureManagement(req, res, next) {
  try {
    if (!(await canManageOrganizationUnit(req.user, null))) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only company Owners and company-wide Managers can create organization units"
        },
      });
    }
    next();
  } catch (error) {
    console.error("Organization unit authorization failed:", error);
    res.status(500).json({
      error: { code: "AUTHORIZATION_FAILED", message: "Unable to verify organization management access" }
    });
  }
}


router.post(
  "/",
  authenticate,
  validateBody(createOrganizationUnitSchema),
  requireCompanyStructureManagement,
  createOrganizationUnit
);
router.get(
  "/",
  authenticate,
  getOrganizationUnits
);

module.exports = router;