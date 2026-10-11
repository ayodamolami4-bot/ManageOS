const express = require("express");

const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  changeStatus
} = require("../controllers/taskController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const {
  validateBody
} = require("../middleware/validate");

const {
  createTaskSchema,
  updateTaskSchema,
  changeTaskStatusSchema
} = require("../validators/taskSchemas");

const {
  requireTaskCreation,
  requireTaskView,
  requireTaskManagement,
  requireTaskStatusChange
} = require("../middleware/taskAuthorization");

const router =
  express.Router();

/*
 * Create task.
 *
 * Validation happens before authorization
 * because task authorization uses projectId.
 */
router.post(
  "/",
  authenticate,
  validateBody(createTaskSchema),
  requireTaskCreation,
  createTask
);

/*
 * Get tasks visible to the
 * authenticated user.
 */
router.get(
  "/",
  authenticate,
  getTasks
);

/*
 * Get one task.
 */
router.get(
  "/:taskId",
  authenticate,
  requireTaskView,
  getTaskById
);

/*
 * Change task workflow status.
 *
 * Validation happens before authorization
 * because task authorization uses newStatus.
 */
router.put(
  "/:taskId/status",
  authenticate,
  validateBody(changeTaskStatusSchema),
  requireTaskStatusChange,
  changeStatus
);

/*
 * Update task details.
 *
 * Status cannot be changed through this
 * endpoint.
 */
router.put(
  "/:taskId",
  authenticate,
  validateBody(updateTaskSchema),
  requireTaskManagement,
  updateTask
);

/*
 * Delete task.
 */
router.delete(
  "/:taskId",
  authenticate,
  requireTaskManagement,
  deleteTask
);

module.exports = router;