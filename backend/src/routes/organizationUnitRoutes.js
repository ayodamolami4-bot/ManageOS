const express = require("express");

const { createOrganizationUnit, getOrganizationUnits } = require("../controllers/organizationUnitController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorize");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("organization.manage"),
  createOrganizationUnit
);
router.get(
  "/",
  authenticate,
  getOrganizationUnits
);

module.exports = router;