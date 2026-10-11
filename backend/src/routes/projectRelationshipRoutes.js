const express = require("express");

const {
  assignLead,
  addMember,
  addOrganizationUnit
} = require("../controllers/projectRelationshipController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const {
  requireProjectManagement
} = require("../middleware/projectAuthorization");

const router = express.Router();

router.post(
  "/:projectId/leads",
  authenticate,
  requireProjectManagement,
  assignLead
);

router.post(
  "/:projectId/members",
  authenticate,
  requireProjectManagement,
  addMember
);

router.post(
  "/:projectId/organization-units",
  authenticate,
  requireProjectManagement,
  addOrganizationUnit
);

module.exports = router;