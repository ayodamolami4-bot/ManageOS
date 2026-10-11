const express = require("express");

const {
  addMembership,
  getMemberships,
  getMembershipsForManagedUser,
  removeMembershipById
} = require("../controllers/organizationMembershipController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const { z } = require("zod");
const { validateBody, validateParams } = require("../middleware/validate");
const uuid = z.string().uuid();
const createMembershipBody = z.object({
  userId: uuid,
  organizationUnitId: uuid
}).strict();
const membershipIdParams = z.object({ membershipId: uuid }).strict();
const userIdParams = z.object({ userId: uuid }).strict();

const router = express.Router();

/*
 * Add a user to an organization unit.
 *
 * Authorization is handled inside
 * organizationMembershipService because
 * access depends on:
 *
 * - OWNER scope
 * - MANAGER scope
 * - TEAM_LEAD's own team
 */
router.post(
  "/",
  authenticate,
  validateBody(createMembershipBody),
  addMembership
);

/*
 * Current user's memberships.
 */
router.get(
  "/me",
  authenticate,
  getMemberships
);

/*
 * View another user's memberships.
 *
 * Service checks whether the requester
 * can access that user.
 */
router.get(
  "/user/:userId",
  authenticate,
  validateParams(userIdParams),
  getMembershipsForManagedUser
);

/*
 * Remove a membership.
 *
 * Service checks organization-unit scope
 * and Team Lead authority.
 */
router.delete(
  "/:membershipId",
  authenticate,
  validateParams(membershipIdParams),
  removeMembershipById
);

module.exports = router;