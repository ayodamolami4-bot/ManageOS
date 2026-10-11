const express = require("express");

const {
  assignLead,
  addMember,
  addOrganizationUnit,
  getMembers
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

const router = express.Router();

router.get("/:projectId/members", authenticate, validateParams(projectRef), requireProjectView, getMembers);


router.post(
  "/:projectId/leads",
  authenticate,
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
  requireProjectManagement,
  addOrganizationUnit
);

module.exports = router;