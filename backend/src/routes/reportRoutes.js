const express = require("express");

const {
  createReport,
  getTaskReports,
  getReportById
} = require("../controllers/reportController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/tasks/:taskId/reports",
  authenticate,
  createReport
);

router.get(
  "/tasks/:taskId/reports",
  authenticate,
  getTaskReports
);

router.get(
  "/reports/:reportId",
  authenticate,
  getReportById
);

module.exports = router;