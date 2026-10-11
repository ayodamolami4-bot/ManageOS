const express = require("express");

const {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequestStatus,
  getRecipients
} = require("../controllers/requestController");

const { authenticate } = require("../middleware/authMiddleware");

const { validateBody, validateParams } = require("../middleware/validate");
const { requestParams, requestBody, requestStatusBody } = require("../validators/operationalSchemas");

const router = express.Router();

router.post(
  "/requests",
  authenticate,
  validateBody(requestBody),
  createRequest
);

router.get(
  "/requests",
  authenticate,
  getAllRequests
);

router.get(
  "/requests/recipients",
  authenticate,
  getRecipients
);

router.get(
  "/requests/:requestId",
  authenticate,
  validateParams(requestParams),
  getRequestById
);

router.put(
  "/requests/:requestId/status",
  authenticate,
  validateParams(requestParams),
  validateBody(requestStatusBody),
  updateRequestStatus
);

module.exports = router;