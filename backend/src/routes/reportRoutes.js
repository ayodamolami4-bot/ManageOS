const express = require("express");

const {
  createReport,
  getTaskReports,
  getReportById
} = require("../controllers/reportController");

const { authenticate } = require("../middleware/authMiddleware");

const { validateBody, validateParams } = require("../middleware/validate");
const { reportBodySchema, taskIdParamsSchema } = require("../validators/reportSchemas");

const router = express.Router();

router.post(
  "/tasks/:taskId/reports",
  authenticate,
  validateParams(taskIdParamsSchema),
  validateBody(reportBodySchema),
  createReport
);

router.get(
  "/tasks/:taskId/reports",
  authenticate,
  validateParams(taskIdParamsSchema),
  getTaskReports
);

router.get(
  "/reports/:reportId",
  authenticate,
  getReportById
);

module.exports = router;