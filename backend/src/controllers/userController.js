const {
  getUsers,
  getUser,
  updateUser,
  getRoles,
  assignRole,
  removeRole
} = require("../services/userService");

async function getCompanyUsers(
  req,
  res
) {
  try {
    const users =
      await getUsers(
        req.user
      );

    res.status(200).json({
      data: users,
      message:
        "Users retrieved successfully"
    });
  } catch (error) {
    console.error(
      "User retrieval failed:",
      error
    );

    res.status(500).json({
      error: {
        code:
          "USERS_RETRIEVAL_FAILED",
        message:
          "Unable to retrieve users"
      }
    });
  }
}

async function getUserById(
  req,
  res
) {
  try {
    const user =
      await getUser(
        req.params.userId,
        req.user
      );

    res.status(200).json({
      data: user,
      message:
        "User retrieved successfully"
    });
  } catch (error) {
    console.error(
      "User retrieval failed:",
      error
    );

    if (
      error.message ===
      "INVALID_USER_REFERENCE"
    ) {
      return res.status(400).json({
        error: {
          code:
            "INVALID_USER_REFERENCE",
          message:
            "Invalid user ID"
        }
      });
    }

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
      "FORBIDDEN"
    ) {
      return res.status(403).json({
        error: {
          code:
            "FORBIDDEN",
          message:
            "You do not have permission to view this user"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "USER_RETRIEVAL_FAILED",
        message:
          "Unable to retrieve user"
      }
    });
  }
}

async function updateUserById(
  req,
  res
) {
  try {
    const user =
      await updateUser(
        req.params.userId,
        req.body,
        req.user
      );

    res.status(200).json({
      data: user,
      message:
        "User updated successfully"
    });
  } catch (error) {
    console.error(
      "User update failed:",
      error
    );

    if (
      error.message ===
        "INVALID_USER_REFERENCE" ||
      error.message ===
        "INVALID_USER_INPUT"
    ) {
      return res.status(400).json({
        error: {
          code:
            error.message,
          message:
            "Invalid user information"
        }
      });
    }

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

    if (error.message === "EMAIL_CHANGE_REQUIRES_VERIFICATION") {
      return res.status(409).json({
        error: {code:"EMAIL_CHANGE_REQUIRES_VERIFICATION",
          message:"Change your email from Account Settings and verify the new address."}
      });
    }

    if (
      error.message ===
      "EMAIL_ALREADY_IN_USE"
    ) {
      return res.status(409).json({
        error: {
          code:
            "EMAIL_ALREADY_IN_USE",
          message:
            "That email is already in use"
        }
      });
    }

    if (
      error.message ===
      "FORBIDDEN"
    ) {
      return res.status(403).json({
        error: {
          code:
            "FORBIDDEN",
          message:
            "You do not have permission to update this user"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "USER_UPDATE_FAILED",
        message:
          "Unable to update user"
      }
    });
  }
}

async function getAvailableRoles(
  req,
  res
) {
  try {
    const roles =
      await getRoles(
        req.user
      );

    res.status(200).json({
      data: roles,
      message:
        "Roles retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Role retrieval failed:",
      error
    );

    res.status(500).json({
      error: {
        code:
          "ROLES_RETRIEVAL_FAILED",
        message:
          "Unable to retrieve roles"
      }
    });
  }
}

async function assignUserRole(
  req,
  res
) {
  try {
    const assignment =
      await assignRole({
        userId:
          req.params.userId,

        roleId:
          req.body.roleId,

        organizationUnitId:
          req.body.organizationUnitId,

        currentUser:
          req.user
      });

    res.status(201).json({
      data: assignment,
      message:
        "Role assigned successfully"
    });
  } catch (error) {
    console.error(
      "Role assignment failed:",
      error
    );

    if (
      error.message ===
        "INVALID_USER_REFERENCE" ||
      error.message ===
        "INVALID_ORGANIZATION_UNIT_REFERENCE"
    ) {
      return res.status(400).json({
        error: {
          code:
            error.message,
          message:
            "Invalid user or role assignment reference"
        }
      });
    }

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
      "ROLE_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "ROLE_NOT_FOUND",
          message:
            "Role not found"
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
      "ROLE_ALREADY_ASSIGNED"
    ) {
      return res.status(409).json({
        error: {
          code:
            "ROLE_ALREADY_ASSIGNED",
          message:
            "That role is already assigned to the user"
        }
      });
    }

    if (
      error.message ===
      "OWNER_ROLE_MUST_BE_COMPANY_WIDE"
    ) {
      return res.status(400).json({
        error: {
          code:
            "OWNER_ROLE_MUST_BE_COMPANY_WIDE",
          message:
            "OWNER cannot be scoped to an organization unit"
        }
      });
    }

    if (
      error.message ===
      "OWNER_ROLE_REQUIRES_OWNER"
    ) {
      return res.status(403).json({
        error: {
          code:
            "OWNER_ROLE_REQUIRES_OWNER",
          message:
            "Only an owner can assign the OWNER role"
        }
      });
    }

    if (
      error.message ===
      "ROLE_ASSIGNMENT_FORBIDDEN"
    ) {
      return res.status(403).json({
        error: {
          code:
            "ROLE_ASSIGNMENT_FORBIDDEN",
          message:
            "You do not have permission to assign this role"
        }
      });
    }

    if (
      error.message ===
      "FORBIDDEN"
    ) {
      return res.status(403).json({
        error: {
          code:
            "FORBIDDEN",
          message:
            "You do not have permission to manage this user"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "ROLE_ASSIGNMENT_FAILED",
        message:
          "Unable to assign role"
      }
    });
  }
}

async function removeUserRole(
  req,
  res
) {
  try {
    const assignment =
      await removeRole({
        userId:
          req.params.userId,

        roleId:
          req.params.roleId,

        organizationUnitId:
          req.query
            .organizationUnitId,

        currentUser:
          req.user
      });

    res.status(200).json({
      data: assignment,
      message:
        "Role removed successfully"
    });
  } catch (error) {
    console.error(
      "Role removal failed:",
      error
    );

    if (
      error.message ===
        "INVALID_USER_REFERENCE" ||
      error.message ===
        "INVALID_ORGANIZATION_UNIT_REFERENCE"
    ) {
      return res.status(400).json({
        error: {
          code:
            error.message,
          message:
            "Invalid role assignment reference"
        }
      });
    }

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
      "ROLE_ASSIGNMENT_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "ROLE_ASSIGNMENT_NOT_FOUND",
          message:
            "Role assignment not found"
        }
      });
    }

    if (
      error.message ===
      "CANNOT_REMOVE_LAST_OWNER"
    ) {
      return res.status(409).json({
        error: {
          code:
            "CANNOT_REMOVE_LAST_OWNER",
          message:
            "A company must retain at least one owner"
        }
      });
    }

    if (
      error.message ===
      "FORBIDDEN"
    ) {
      return res.status(403).json({
        error: {
          code:
            "FORBIDDEN",
          message:
            "You do not have permission to remove this role"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "ROLE_REMOVAL_FAILED",
        message:
          "Unable to remove role"
      }
    });
  }
}

module.exports = {
  getCompanyUsers,
  getUserById,
  updateUserById,
  getAvailableRoles,
  assignUserRole,
  removeUserRole
};