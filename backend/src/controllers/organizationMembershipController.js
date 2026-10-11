const {
  addUserToOrganizationUnit,
  getMyMemberships,
  getUserMemberships,
  removeMembership
} = require("../services/organizationMembershipService");

async function addMembership(
  req,
  res
) {
  try {
    const membership =
      await addUserToOrganizationUnit(
        {
          userId:
            req.body.userId,
          organizationUnitId:
            req.body.organizationUnitId
        },
        req.user
      );

    res.status(201).json({
      data: membership,
      message:
        "User added to organization unit successfully"
    });
  } catch (error) {
    console.error(
      "Organization membership creation failed:",
      error
    );

    if (
      error.message ===
      "USER_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "USER_NOT_FOUND",
          message:
            "User not found in your company"
        }
      });
    }

    if (
      error.message ===
      "ORGANIZATION_UNIT_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "ORGANIZATION_UNIT_NOT_FOUND",
          message:
            "Organization unit not found in your company"
        }
      });
    }

    if (
      error.message ===
      "MEMBERSHIP_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        error: {
          code:
            "MEMBERSHIP_ALREADY_EXISTS",
          message:
            "User is already a member of that organization unit"
        }
      });
    }

    if (error.message === "FORBIDDEN" ||
        error.message === "TEAM_LEAD_CAN_ONLY_ADD_EMPLOYEES" ||
        error.message === "TEAM_LEAD_CAN_ONLY_MANAGE_EMPLOYEES") {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "You cannot manage this organization membership" }
      });
    }

    res.status(500).json({
      error: {
        code:
          "ORGANIZATION_MEMBERSHIP_CREATION_FAILED",
        message:
          "Unable to add user to organization unit"
      }
    });
  }
}

async function getMemberships(
  req,
  res
) {
  try {
    const memberships =
      await getMyMemberships(req.user);

    res.status(200).json({
      data: memberships,
      message:
        "Organization memberships retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Organization membership retrieval failed:",
      error
    );

    if (error.message === "FORBIDDEN" ||
        error.message === "TEAM_LEAD_CAN_ONLY_ADD_EMPLOYEES" ||
        error.message === "TEAM_LEAD_CAN_ONLY_MANAGE_EMPLOYEES") {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "You cannot manage this organization membership" }
      });
    }

    res.status(500).json({
      error: {
        code:
          "ORGANIZATION_MEMBERSHIP_RETRIEVAL_FAILED",
        message:
          "Unable to retrieve organization memberships"
      }
    });
  }
}

async function getMembershipsForManagedUser(
  req,
  res
) {
  try {
    const memberships =
      await getUserMemberships(req.params.userId, req.user);

    res.status(200).json({
      data: memberships,
      message:
        "Organization memberships retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Organization membership retrieval failed:",
      error
    );

    if (
      error.message ===
      "USER_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "USER_NOT_FOUND",
          message:
            "User not found in your company"
        }
      });
    }

    if (error.message === "FORBIDDEN" ||
        error.message === "TEAM_LEAD_CAN_ONLY_ADD_EMPLOYEES" ||
        error.message === "TEAM_LEAD_CAN_ONLY_MANAGE_EMPLOYEES") {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "You cannot manage this organization membership" }
      });
    }

    res.status(500).json({
      error: {
        code:
          "ORGANIZATION_MEMBERSHIP_RETRIEVAL_FAILED",
        message:
          "Unable to retrieve organization memberships"
      }
    });
  }
}

async function removeMembershipById(
  req,
  res
) {
  try {
    const membership =
      await removeMembership(
        req.params.membershipId,
        req.user
      );

    res.status(200).json({
      data: membership,
      message:
        "User removed from organization unit successfully"
    });
  } catch (error) {
    console.error(
      "Organization membership removal failed:",
      error
    );

    if (
      error.message ===
      "MEMBERSHIP_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "MEMBERSHIP_NOT_FOUND",
          message:
            "Organization membership not found"
        }
      });
    }

    if (error.message === "FORBIDDEN" ||
        error.message === "TEAM_LEAD_CAN_ONLY_ADD_EMPLOYEES" ||
        error.message === "TEAM_LEAD_CAN_ONLY_MANAGE_EMPLOYEES") {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "You cannot manage this organization membership" }
      });
    }

    res.status(500).json({
      error: {
        code:
          "ORGANIZATION_MEMBERSHIP_REMOVAL_FAILED",
        message:
          "Unable to remove organization membership"
      }
    });
  }
}

module.exports = {
  addMembership,
  getMemberships,
  getMembershipsForManagedUser,
  removeMembershipById
};