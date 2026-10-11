const express = require("express");

const {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequestStatus
} = require("../controllers/requestController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/requests",
  authenticate,
  createRequest
);

router.get(
  "/requests",
  authenticate,
  getAllRequests
);

router.get(
  "/requests/:requestId",
  authenticate,
  getRequestById
);

router.put(
  "/requests/:requestId/status",
  authenticate,
  updateRequestStatus
);

module.exports = router;