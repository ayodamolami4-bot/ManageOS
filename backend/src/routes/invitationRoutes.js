const express = require("express");
const { rateLimit } = require("express-rate-limit");

const {
  createInvitation,
  acceptInvitation,
  previewInvitation
} = require("../controllers/invitationController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const {
  validateBody
} = require("../middleware/validate");

const {
  createInvitationSchema,
  acceptInvitationSchema,
  previewInvitationSchema
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

// Tokens are supplied in a POST body rather than a URL query string, so
// gateway and server request logs do not need to contain the bearer token.
router.post("/preview", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { code: "INVITATION_PREVIEW_RATE_LIMITED", message: "Please try again later." } }
}), validateBody(previewInvitationSchema), previewInvitation);

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