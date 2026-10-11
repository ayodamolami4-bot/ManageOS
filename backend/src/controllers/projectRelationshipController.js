const {
  assignProjectLead,
  addProjectMemberToProject,
  linkProjectOrganizationUnit,
  getProjectMembers,
  getProjectLeadsForCompany,
  getProjectUnitsForCompany
} = require("../services/projectRelationshipService");

async function assignLead(req, res) {
  try {
    const relationship = await assignProjectLead(
      req.params.projectId,
      req.body.userId,
      req.user
    );

    res.status(201).json({
      data: relationship,
      message: "Project lead assigned successfully"
    });
  } catch (error) {
    console.error("Project lead assignment failed:", error);

    if (error.message === "PROJECT_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found"
        }
      });
    }

    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found in your company"
        }
      });
    }

    if (error.message === "USER_NOT_ELIGIBLE_TO_LEAD") {
      return res.status(422).json({
        error: {
          code: "USER_NOT_ELIGIBLE_TO_LEAD",
          message: "Choose a manager or team lead with scope over the project"
        }
      });
    }
    if (error.code === "23505") {
      return res.status(409).json({
        error: { code: "PROJECT_LEAD_ALREADY_EXISTS", message: "This person already leads the project" }
      });
    }

    res.status(500).json({
      error: {
        code: "PROJECT_LEAD_ASSIGNMENT_FAILED",
        message: "Unable to assign project lead"
      }
    });
  }
}

async function addMember(req, res) {
  try {
    const relationship = await addProjectMemberToProject(
      req.params.projectId,
      req.body.userId,
      req.user
    );

    res.status(201).json({
      data: relationship,
      message: "Project member added successfully"
    });
  } catch (error) {
    console.error("Project member addition failed:", error);

    if (error.message === "PROJECT_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found"
        }
      });
    }

    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found in your company"
        }
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        error: { code: "PROJECT_MEMBER_ALREADY_EXISTS", message: "This relationship already exists" }
      });
    }

    res.status(500).json({
      error: {
        code: "PROJECT_MEMBER_ADDITION_FAILED",
        message: "Unable to add project member"
      }
    });
  }
}

async function addOrganizationUnit(req, res) {
  try {
    const relationship = await linkProjectOrganizationUnit(
      req.params.projectId,
      req.body.organizationUnitId,
      req.user
    );

    res.status(201).json({
      data: relationship,
      message: "Organization unit linked to project successfully"
    });
  } catch (error) {
    console.error(
      "Project organization unit linking failed:",
      error
    );

    if (error.message === "PROJECT_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found"
        }
      });
    }

    if (error.message === "ORGANIZATION_UNIT_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "ORGANIZATION_UNIT_NOT_FOUND",
          message: "Organization unit not found in your company"
        }
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        error: { code: "PROJECT_UNIT_ALREADY_LINKED", message: "This relationship already exists" }
      });
    }

    res.status(500).json({
      error: {
        code: "PROJECT_ORGANIZATION_UNIT_LINK_FAILED",
        message: "Unable to link organization unit to project"
      }
    });
  }
}

async function getMembers(req, res) {
  try {
    const users = await getProjectMembers(req.params.projectId, req.user);
    res.json({ data: users });
  } catch (error) {
    console.error("Project member retrieval failed:", error);
    res.status(500).json({ error: { code: "PROJECT_MEMBERS_FAILED", message: "Unable to load project members" } });
  }
}

async function getLeads(req, res) {
  try {
    const data = await getProjectLeadsForCompany(req.params.projectId, req.user);
    res.json({ data });
  } catch (error) {
    if (error.message === "PROJECT_NOT_FOUND") {
      return res.status(404).json({ error: { code: "PROJECT_NOT_FOUND", message: "Project not found" } });
    }
    console.error("Project lead retrieval failed:", error);
    res.status(500).json({ error: { code: "PROJECT_LEADS_FAILED", message: "Unable to load project leads" } });
  }
}

async function getUnits(req, res) {
  try {
    const data = await getProjectUnitsForCompany(req.params.projectId, req.user);
    res.json({ data });
  } catch (error) {
    if (error.message === "PROJECT_NOT_FOUND") {
      return res.status(404).json({ error: { code: "PROJECT_NOT_FOUND", message: "Project not found" } });
    }
    console.error("Project unit retrieval failed:", error);
    res.status(500).json({ error: { code: "PROJECT_UNITS_FAILED", message: "Unable to load project units" } });
  }
}

module.exports = {
  assignLead,
  addMember,
  addOrganizationUnit,
  getMembers,
  getLeads,
  getUnits
};