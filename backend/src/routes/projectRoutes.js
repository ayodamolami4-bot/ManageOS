const express = require("express");

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject
} = require("../controllers/projectController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const {
  validateBody
} = require("../middleware/validate");

const {
  createProjectSchema,
  updateProjectSchema
} = require("../validators/projectSchemas");

const {
  requireProjectView,
  requireProjectManagement
} = require("../middleware/projectAuthorization");

const {
  requireProjectCreation
} = require("../middleware/projectCreationAuthorization");

const { z } = require("zod");
const { validateParams } = require("../middleware/validate");
const { listProjectGoals } = require("../controllers/goalProjectController");

const router = express.Router();

/*
 * Create project.
 *
 * Request validation happens before
 * authorization so the authorization layer
 * never receives malformed project data.
 */
router.post(
  "/",
  authenticate,
  validateBody(createProjectSchema),
  requireProjectCreation,
  createProject
);

/*
 * Get projects visible to the
 * authenticated user.
 */
router.get(
  "/",
  authenticate,
  getProjects
);

/*
 * Get one project.
 */
router.get(
  "/:projectId",
  authenticate,
  requireProjectView,
  getProjectById
);

/*
 * Update project.
 *
 * Request validation happens before
 * project-management authorization.
 */
router.put(
  "/:projectId",
  authenticate,
  validateBody(updateProjectSchema),
  requireProjectManagement,
  updateProject
);

router.get("/:projectId/goals",
  authenticate,
  validateParams(z.object({ projectId: z.string().uuid() }).strict()),
  requireProjectView,
  listProjectGoals);

module.exports = router;