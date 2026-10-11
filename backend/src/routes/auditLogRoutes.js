const router = require("express").Router();
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/authorize");
const { listAuditLogs } = require("../controllers/auditLogController");

router.get("/", authenticate, authorize("audit.view"), listAuditLogs);

module.exports = router;
