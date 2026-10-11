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
  removeMembershipById
);

module.exports = router;