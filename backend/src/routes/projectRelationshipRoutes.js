const express = require("express");

const {
  assignLead,
  addMember,
  addOrganizationUnit,
  getMembers,
  getLeads,
  getUnits
} = require("../controllers/projectRelationshipController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const {
  requireProjectManagement,
  requireProjectView
} = require("../middleware/projectAuthorization");

const { validateBody, validateParams } = require("../middleware/validate");
const { z } = require("zod");
const projectRef = z.object({ projectId: z.string().uuid() }).strict();
const memberRef = z.object({ userId: z.string().uuid() }).strict();
const unitRef = z.object({ organizationUnitId: z.string().uuid() }).strict();

const router = express.Router();

router.get("/:projectId/members", authenticate, validateParams(projectRef), requireProjectView, getMembers);
router.get("/:projectId/leads", authenticate, validateParams(projectRef), requireProjectView, getLeads);
router.get("/:projectId/organization-units", authenticate, validateParams(projectRef), requireProjectView, getUnits);


router.post(
  "/:projectId/leads",
  authenticate,
  validateParams(projectRef),
  validateBody(memberRef),
  requireProjectManagement,
  assignLead
);

router.post(
  "/:projectId/members",
  authenticate,
  validateParams(projectRef),
  validateBody(memberRef),
  requireProjectManagement,
  addMember
);

router.post(
  "/:projectId/organization-units",
  authenticate,
  validateParams(projectRef),
  validateBody(unitRef),
  requireProjectManagement,
  addOrganizationUnit
);

module.exports = router;