const {
  getGoalProjects, getProjectGoals, changeGoalProjectLink,
} = require("../repositories/goalProjectRepository");
const { canViewGoal, canViewProject, canManageProject } = require("../services/authorizationService");
const { getGoalById } = require("../repositories/goalRepository");
const { getProjectById } = require("../repositories/projectRepository");

function errorResponse(res, error) {
  const code = error.message;
  if (code === "FORBIDDEN") return res.status(403).json({
    error: { code, message: "You do not have permission to connect this project to company goals" },
  });
  if (["GOAL_NOT_FOUND", "PROJECT_NOT_FOUND"].includes(code)) return res.status(404).json({
    error: { code, message: "Goal or project not found" },
  });
  if (["GOAL_PROJECT_ALREADY_LINKED", "GOAL_PROJECT_NOT_LINKED"].includes(code)) {
    return res.status(409).json({ error: { code, message: "This goal-project relationship is already in that state" } });
  }
  console.error("Goal/project relationship failed:", error);
  return res.status(500).json({ error: {
    code: "GOAL_PROJECT_OPERATION_FAILED", message: "Unable to update goal-project relationships",
  } });
}

async function listGoalProjects(req, res) {
  try {
    const goal = await getGoalById(req.user.company_id, req.params.goalId);
    if (!goal) throw new Error("GOAL_NOT_FOUND");
    const linked = await getGoalProjects(req.params.goalId, req.user.company_id);
    const visibility = await Promise.all(linked.map(async (project) => ({
      project, allowed: await canViewProject(req.user, project.id),
    })));
    return res.json({ data: visibility.filter((item) => item.allowed).map((item) => item.project) });
  } catch (error) {
    return errorResponse(res, error);
  }
}

async function listProjectGoals(req, res) {
  try {
    if (!(await canViewGoal(req.user))) throw new Error("FORBIDDEN");
    const project = await getProjectById(req.user.company_id, req.params.projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");
    return res.json({ data: await getProjectGoals(req.params.projectId, req.user.company_id) });
  } catch (error) {
    return errorResponse(res, error);
  }
}

async function changeLink(req, res, action) {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    if (!(await canManageProject(req.user, projectId))) throw new Error("FORBIDDEN");
    const data = await changeGoalProjectLink({
      goalId: req.params.goalId, projectId, user: req.user, action,
    });
    return res.status(action === "LINK" ? 201 : 200).json({
      data, message: action === "LINK" ? "Project linked to goal" : "Project removed from goal",
    });
  } catch (error) {
    return errorResponse(res, error);
  }
}

const linkGoalProject = (req, res) => changeLink(req, res, "LINK");
const unlinkGoalProject = (req, res) => changeLink(req, res, "UNLINK");

module.exports = { listGoalProjects, listProjectGoals, linkGoalProject, unlinkGoalProject };
