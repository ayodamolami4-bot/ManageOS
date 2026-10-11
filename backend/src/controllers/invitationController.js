const {
  createUserInvitation,
  acceptUserInvitation
} = require("../services/invitationService");

const emailService = require("../services/emailService");
const { revokeUndeliveredInvitation } = require("../repositories/invitationRepository");

async function createInvitation(
  req,
  res
) {
  if (process.env.NODE_ENV === "production" && !emailService.configured()) {
    return res.status(503).json({
      error: {
        code: "INVITATION_DELIVERY_UNAVAILABLE",
        message: "Invitation email delivery is not configured."
      }
    });
  }
  try {
    const result =
      await createUserInvitation(
        {
          email:
            req.body.email,

          roleId:
            req.body.roleId,

          organizationUnitId:
            req.body.organizationUnitId
        },
        req.user
      );

    if (process.env.NODE_ENV === "production") {
      try {
        await emailService.sendInvitationEmail({
          to: req.body.email,
          token: result.token,
          companyName: req.user.company_name,
          invitationId: result.invitation.id,
        });
      } catch (deliveryError) {
        console.error("Invitation delivery could not complete.");
        try {
          await revokeUndeliveredInvitation({
            invitationId: result.invitation.id,
            companyId: req.user.company_id,
            actorId: req.user.id,
          });
        } catch (cleanupError) {
          console.error("Invitation delivery cleanup failed.");
        }
        return res.status(503).json({
          error: {
            code: "INVITATION_DELIVERY_FAILED",
            message: "Invitation could not be delivered. Please try again later."
          }
        });
      }
    }

    const response = {
      data: {
        ...result.invitation
      },
      message:
        "Invitation created successfully"
    };

    /*
     * Development only:
     * return the token so we can test
     * invitation acceptance before an
     * email service is connected.
     */
    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      response.data.token =
        result.token;

      response.data.acceptance_endpoint =
        "/api/invitations/accept";
    }

    res.status(201).json(
      response
    );
  } catch (error) {
    console.error(
      "Invitation creation failed:",
      error
    );

    if (
      error.message ===
        "INVALID_EMAIL" ||
      error.message ===
        "ROLE_ID_REQUIRED" ||
      error.message ===
        "INVALID_ROLE_REFERENCE" ||
      error.message ===
        "INVALID_ORGANIZATION_UNIT_REFERENCE" ||
      error.message ===
        "OWNER_ROLE_MUST_BE_COMPANY_WIDE" ||
      error.message ===
        "TEAM_LEAD_ORGANIZATION_UNIT_REQUIRED" ||
      error.message ===
        "TEAM_LEAD_CAN_ONLY_INVITE_EMPLOYEES"
    ) {
      return res.status(400).json({
        error: {
          code:
            error.message,

          message:
            "Invalid invitation details"
        }
      });
    }

    if (
      error.message ===
        "ROLE_NOT_FOUND" ||
      error.message ===
        "ORGANIZATION_UNIT_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            error.message,

          message:
            "Requested invitation resource was not found"
        }
      });
    }

    if (
      error.message ===
      "USER_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        error: {
          code:
            "USER_ALREADY_EXISTS",

          message:
            "A user with that email already exists in your company"
        }
      });
    }

    if (
      error.message ===
      "INVITATION_ALREADY_PENDING"
    ) {
      return res.status(409).json({
        error: {
          code:
            "INVITATION_ALREADY_PENDING",

          message:
            "A pending invitation already exists for this email"
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
            "Only an owner can invite someone as OWNER"
        }
      });
    }

    if (
      error.message ===
      "INVITATION_SCOPE_FORBIDDEN"
    ) {
      return res.status(403).json({
        error: {
          code:
            "INVITATION_SCOPE_FORBIDDEN",

          message:
            "You do not have permission to create this invitation"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "INVITATION_CREATION_FAILED",

        message:
          "Unable to create invitation"
      }
    });
  }
}

async function acceptInvitation(
  req,
  res
) {
  try {
    const result =
      await acceptUserInvitation({
        token:
          req.body.token,

        firstName:
          req.body.firstName,

        lastName:
          req.body.lastName,

        password:
          req.body.password
      });

    res.status(201).json({
      data: result.user,

      message:
        "Invitation accepted successfully"
    });
  } catch (error) {
    console.error(
      "Invitation acceptance failed:",
      error
    );

    if (
      error.message ===
        "INVITATION_TOKEN_REQUIRED" ||
      error.message ===
        "NAME_REQUIRED" ||
      error.message ===
        "PASSWORD_REQUIRED" ||
      error.message ===
        "INVALID_INVITATION_TOKEN" ||
      error.message ===
        "INVALID_USER_INPUT" ||
      error.message ===
        "INVALID_PASSWORD"
    ) {
      return res.status(400).json({
        error: {
          code:
            error.message,

          message:
            "Invalid invitation acceptance details"
        }
      });
    }

    if (
      error.message ===
      "INVITATION_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "INVITATION_NOT_FOUND",

          message:
            "Invitation not found"
        }
      });
    }

    if (
      error.message ===
      "INVITATION_NOT_ACTIVE"
    ) {
      return res.status(409).json({
        error: {
          code:
            "INVITATION_NOT_ACTIVE",

          message:
            "This invitation is no longer active"
        }
      });
    }

    if (
      error.message ===
      "INVITATION_EXPIRED"
    ) {
      return res.status(410).json({
        error: {
          code:
            "INVITATION_EXPIRED",

          message:
            "This invitation has expired"
        }
      });
    }

    if (
      error.message ===
      "USER_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        error: {
          code:
            "USER_ALREADY_EXISTS",

          message:
            "A user with this invitation email already exists"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "INVITATION_ACCEPTANCE_FAILED",

        message:
          "Unable to accept invitation"
      }
    });
  }
}

module.exports = {
  createInvitation,
  acceptInvitation
};