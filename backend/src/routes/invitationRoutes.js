const express = require("express");

const {
  createInvitation,
  acceptInvitation
} = require("../controllers/invitationController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const {
  validateBody
} = require("../middleware/validate");

const {
  createInvitationSchema,
  acceptInvitationSchema
} = require("../validators/invitationSchemas");

const router =
  express.Router();

/*
 * Create invitation.
 *
 * The request is authenticated and validated
 * before the invitation service performs its
 * role and organization authorization.
 */
router.post(
  "/",
  authenticate,
  validateBody(createInvitationSchema),
  createInvitation
);

/*
 * Accept invitation.
 *
 * Public endpoint because the invitation token
 * acts as the credential.
 */
router.post(
  "/accept",
  validateBody(acceptInvitationSchema),
  acceptInvitation
);

module.exports = router;