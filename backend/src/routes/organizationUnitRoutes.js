const express = require("express");

const { createOrganizationUnit, getOrganizationUnits } = require("../controllers/organizationUnitController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorize");

const { validateBody } = require("../middleware/validate");
const { createOrganizationUnitSchema } = require("../validators/organizationUnitSchemas");

const router = express.Router();

router.post(
  "/",
  authenticate,
  validateBody(createOrganizationUnitSchema),
  authorize("organization.manage"),
  createOrganizationUnit
);
router.get(
  "/",
  authenticate,
  getOrganizationUnits
);

module.exports = router;