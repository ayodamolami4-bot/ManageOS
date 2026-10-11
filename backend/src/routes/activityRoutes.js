const express = require("express");

const {
  getCompanyActivities,
  getActivityById
} = require("../controllers/activityController");

const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorize");

const router = express.Router();

router.get(
  "/activities",
  authenticate,
  authorize("audit.view"),
  getCompanyActivities
);

router.get(
  "/activities/:activityId",
  authenticate,
  authorize("audit.view"),
  getActivityById
);

module.exports = router;