const {
  createNewMilestone,
  getProjectMilestones,
  getMilestone,
  updateExistingMilestone,
  deleteExistingMilestone
} = require("../services/milestoneService");

async function createMilestone(req, res) {
  try {
    const milestone = await createNewMilestone(
      {
        projectId: req.params.projectId,
        name: req.body.name,
        description: req.body.description,
        status: req.body.status,
        dueDate: req.body.dueDate
      },
      req.user
    );

    res.status(201).json({
      data: milestone,
      message: "Milestone created successfully"
    });
  } catch (error) {
    console.error("Milestone creation failed:", error);

    if (error.message === "PROJECT_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "MILESTONE_CREATION_FAILED",
        message: "Unable to create milestone"
      }
    });
  }
}

async function getMilestones(req, res) {
  try {
    const milestones = await getProjectMilestones(
      req.params.projectId,
      req.user
    );

    res.status(200).json({
      data: milestones,
      message: "Milestones retrieved successfully"
    });
  } catch (error) {
    console.error("Milestone retrieval failed:", error);

    if (error.message === "PROJECT_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "MILESTONE_RETRIEVAL_FAILED",
        message: "Unable to retrieve milestones"
      }
    });
  }
}

async function getMilestoneById(req, res) {
  try {
    const milestone = await getMilestone(
      req.params.projectId,
      req.params.milestoneId,
      req.user
    );

    res.status(200).json({
      data: milestone,
      message: "Milestone retrieved successfully"
    });
  } catch (error) {
    console.error("Milestone retrieval failed:", error);

    if (error.message === "PROJECT_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found"
        }
      });
    }

    if (error.message === "MILESTONE_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "MILESTONE_NOT_FOUND",
          message: "Milestone not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "MILESTONE_RETRIEVAL_FAILED",
        message: "Unable to retrieve milestone"
      }
    });
  }
}

async function updateMilestone(req, res) {
  try {
    const milestone = await updateExistingMilestone(
      {
        projectId: req.params.projectId,
        milestoneId: req.params.milestoneId,
        name: req.body.name,
        description: req.body.description,
        status: req.body.status,
        dueDate: req.body.dueDate
      },
      req.user
    );

    res.status(200).json({
      data: milestone,
      message: "Milestone updated successfully"
    });
  } catch (error) {
    console.error("Milestone update failed:", error);

    if (error.message === "PROJECT_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found"
        }
      });
    }

    if (error.message === "MILESTONE_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "MILESTONE_NOT_FOUND",
          message: "Milestone not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "MILESTONE_UPDATE_FAILED",
        message: "Unable to update milestone"
      }
    });
  }
}

async function deleteMilestone(req, res) {
  try {
    await deleteExistingMilestone(
      req.params.projectId,
      req.params.milestoneId,
      req.user
    );

    res.status(200).json({
      data: null,
      message: "Milestone deleted successfully"
    });
  } catch (error) {
    console.error("Milestone deletion failed:", error);

    if (error.message === "PROJECT_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found"
        }
      });
    }

    if (error.message === "MILESTONE_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "MILESTONE_NOT_FOUND",
          message: "Milestone not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "MILESTONE_DELETION_FAILED",
        message: "Unable to delete milestone"
      }
    });
  }
}

module.exports = {
  createMilestone,
  getMilestones,
  getMilestoneById,
  updateMilestone,
  deleteMilestone
};