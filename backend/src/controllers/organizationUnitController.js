const {
  createUnit,
  getUnits
} = require("../services/organizationUnitService");

async function createOrganizationUnit(req, res) {
  try {
    const unit = await createUnit(
      {
        companyId: req.body.companyId,
        parentUnitId: req.body.parentUnitId,
        name: req.body.name,
        type: req.body.type,
        description: req.body.description
      },
      req.user
    );

    res.status(201).json({
      data: unit,
      message: "Organization unit created successfully"
    });
  } catch (error) {
    console.error("Organization unit creation failed:", error);

    if (error.message === "COMPANY_ACCESS_DENIED") {
      return res.status(403).json({
        error: {
          code: "COMPANY_ACCESS_DENIED",
          message: "You cannot create an organization unit for another company"
        }
      });
    }

    if (error.message === "PARENT_UNIT_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "PARENT_UNIT_NOT_FOUND",
          message: "Parent organization unit not found"
        }
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        error: {
          code: "UNIT_NAME_ALREADY_EXISTS",
          message: "An organization unit with that name already exists"
        }
      });
    }

    return res.status(500).json({
      error: {
        code: "ORGANIZATION_UNIT_CREATION_FAILED",
        message: "Unable to create organization unit"
      }
    });
  }
}
async function getOrganizationUnits(req, res) {
  try {
    const units = await getUnits(req.user);

    res.status(200).json({
      data: units,
      message: "Organization units retrieved successfully"
    });
  } catch (error) {
    console.error("Organization unit retrieval failed:", error);

    res.status(500).json({
      error: {
        code: "ORGANIZATION_UNIT_RETRIEVAL_FAILED",
        message: "Unable to retrieve organization units"
      }
    });
  }
}
module.exports = {
  createOrganizationUnit,
  getOrganizationUnits
};