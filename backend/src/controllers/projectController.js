const {
  createNewProject,
  getCompanyProjects,
  getProject,
  updateExistingProject
} = require("../services/projectService");

async function createProject(req, res) {
  try {
    const project = await createNewProject(
      {
        name: req.body.name,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
        startDate: req.body.startDate,
        dueDate: req.body.dueDate
      },
      req.user
    );

    res.status(201).json({
      data: project,
      message: "Project created successfully"
    });
  } catch (error) {
    console.error("Project creation failed:", error);

    res.status(500).json({
      error: {
        code: "PROJECT_CREATION_FAILED",
        message: "Unable to create project"
      }
    });
  }
}

async function getProjects(req, res) {
  try {
    const projects = await getCompanyProjects(req.user);

    res.status(200).json({
      data: projects,
      message: "Projects retrieved successfully"
    });
  } catch (error) {
    console.error("Project retrieval failed:", error);

    res.status(500).json({
      error: {
        code: "PROJECT_RETRIEVAL_FAILED",
        message: "Unable to retrieve projects"
      }
    });
  }
}

async function getProjectById(req, res) {
  try {
    const project = await getProject(
      req.params.projectId,
      req.user
    );

    res.status(200).json({
      data: project,
      message: "Project retrieved successfully"
    });
  } catch (error) {
    console.error("Project retrieval failed:", error);

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
        code: "PROJECT_RETRIEVAL_FAILED",
        message: "Unable to retrieve project"
      }
    });
  }
}

async function updateProject(req, res) {
  try {
    const project = await updateExistingProject(
      {
        projectId: req.params.projectId,
        name: req.body.name,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
        startDate: req.body.startDate,
        dueDate: req.body.dueDate
      },
      req.user
    );

    if (!project) {
      return res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found"
        }
      });
    }

    res.status(200).json({
      data: project,
      message: "Project updated successfully"
    });
  } catch (error) {
    console.error("Project update failed:", error);

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
        code: "PROJECT_UPDATE_FAILED",
        message: "Unable to update project"
      }
    });
  }
}

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject
};