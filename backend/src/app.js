const express = require("express");
const path = require("node:path");
const { serveFrontend } = require("./middleware/serveFrontend");
const { configuredStore } = require("./utils/storageProvider");
const helmet = require("helmet");
const cors = require("cors");
const pool = require("./db/database");
const authRoutes = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const {
  csrfProtection
} = require("./middleware/csrfProtection");
const organizationUnitRoutes = require("./routes/organizationUnitRoutes");
const organizationMembershipRoutes = require("./routes/organizationMembershipRoutes");
const projectRoutes = require("./routes/projectRoutes");
const projectRelationshipRoutes = require("./routes/projectRelationshipRoutes");
const goalRoutes = require("./routes/goalRoutes");
const milestoneRoutes = require("./routes/milestoneRoutes");
const taskRoutes = require("./routes/taskRoutes");
const taskAssignmentRoutes = require("./routes/taskAssignmentRoutes");
const taskStatusHistoryRoutes = require("./routes/taskStatusHistoryRoutes");
const taskSubmissionRoutes = require("./routes/taskSubmissionRoutes");
const taskReviewRoutes = require("./routes/TaskReviewRoutes");
const reportRoutes = require("./routes/reportRoutes");
const blockerRoutes = require("./routes/blockerRoutes");
const requestRoutes = require("./routes/requestRoutes");
const discussionRoutes = require("./routes/discussionRoutes");
const commentRoutes = require("./routes/commentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const activityRoutes = require("./routes/activityRoutes");
const fileRoutes = require("./routes/fileRoutes");
const userRoutes = require("./routes/userRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");

const app = express();

const frontendOrigin =
  process.env.FRONTEND_URL ||
  process.env.PUBLIC_APP_URL ||
  "http://localhost:5173";

/*
 * Security headers.
 */
app.disable("x-powered-by");
app.use(helmet());

/*
 * CORS.
 *
 * Only the configured frontend origin
 * is allowed to use the browser API
 * with credentials.
 */
app.use(
  cors({
    origin(origin, callback) {
      /*
       * Non-browser clients such as Postman
       * may not send an Origin header.
       */
      if (!origin) {
        return callback(null, true);
      }

      if (origin === frontendOrigin) {
        return callback(null, true);
      }

      return callback(
        new Error(
          "CORS_ORIGIN_NOT_ALLOWED"
        )
      );
    },

    credentials: true,

    methods: [
      "GET",
      "HEAD",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "X-CSRF-Token"
    ],

    optionsSuccessStatus: 204
  })
);

/*
 * Parse JSON request bodies.
 *
 * Limit JSON requests to 1 MB.
 */
app.use(
  express.json({
    limit: "1mb"
  })
);

/*
 * Parse HTTP cookies.
 */
app.use(cookieParser());

/*
 * CSRF protection.
 */
app.use(csrfProtection);

/*
 * Health check.
 */
app.get(
  "/api/health",
  (req, res) => {
    res.json({
      status: "ok",
      message:
        "ManageOS backend is running"
    });
  }
);

/*
 * Database connectivity test.
 */
app.get(
  "/api/db-test",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          "SELECT NOW()"
        );

      res.json({
        status: "ok",
        database: "connected",
        time:
          result.rows[0].now
      });
    } catch (error) {
      console.error(
        "Database connection failed:",
        error
      );

      res.status(500).json({
        status: "error",
        database:
          "not connected"
      });
    }
  }
);

/*
 * Readiness checks database access, not just whether Express is listening.
 * Use this endpoint for deployment health checks.
 */
app.get("/api/ready", async (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    if (process.env.NODE_ENV === "production") {
      // A live demo must never report ready while file uploads would vanish.
      configuredStore();
    }
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected", storage: "configured" });
  } catch (error) {
    console.error("Application readiness check failed:", error.message);
    res.status(503).json({ status: "unavailable" });
  }
});

/*
 * Authentication.
 */
app.use(
  "/api/auth",
  authRoutes
);

/*
 * Organization units.
 */
app.use(
  "/api/organization-units",
  organizationUnitRoutes
);

/*
 * Organization memberships.
 */
app.use(
  "/api/organization-memberships",
  organizationMembershipRoutes
);

/*
 * Projects.
 */
app.use(
  "/api/projects",
  projectRoutes
);

/*
 * Project relationships.
 */
app.use(
  "/api/project-relationships",
  projectRelationshipRoutes
);

/*
 * Goals.
 */
app.use(
  "/api/goals",
  goalRoutes
);

/*
 * Milestones.
 */
app.use(
  "/api",
  milestoneRoutes
);

/*
 * Tasks.
 */
app.use(
  "/api/tasks",
  taskRoutes
);

/*
 * Task assignments.
 */
app.use(
  "/api",
  taskAssignmentRoutes
);

/*
 * Task status history.
 */
app.use(
  "/api",
  taskStatusHistoryRoutes
);

/*
 * Task submissions.
 */
app.use(
  "/api",
  taskSubmissionRoutes
);

/*
 * Task reviews.
 */
app.use(
  "/api",
  taskReviewRoutes
);

/*
 * Reports.
 */
app.use(
  "/api/",
  reportRoutes
);

/*
 * Blockers.
 */
app.use(
  "/api/",
  blockerRoutes
);

/*
 * Requests.
 */
app.use(
  "/api/",
  requestRoutes
);

/*
 * Discussions.
 */
app.use(
  "/api/",
  discussionRoutes
);

/*
 * Comments.
 */
app.use(
  "/api/",
  commentRoutes
);

/*
 * Notifications.
 */
app.use(
  "/api",
  notificationRoutes
);

/*
 * Activities.
 */
app.use(
  "/api",
  activityRoutes
);

/*
 * Files.
 */
app.use(
  "/api/",
  fileRoutes
);

/*
 * Users.
 */
app.use(
  "/api/users",
  userRoutes
);

/*
 * Invitations.
 */
app.use(
  "/api/invitations",
  invitationRoutes
);

/*
 * Formal audit history; permission-protected and company-scoped.
 */
app.use("/api/audit-logs", auditLogRoutes);

/*
 * Production: the same Express origin serves React and /api.
 * Keep this after API routers, before JSON 404 handling.
 */
if (process.env.NODE_ENV === "production") {
  serveFrontend(app, path.resolve(__dirname, "../../frontend/dist"));
}

/*
 * 404 handler.
 */
app.use(
  (req, res) => {
    res.status(404).json({
      error: {
        code:
          "ROUTE_NOT_FOUND",
        message:
          "The requested route does not exist"
      }
    });
  }
);

/*
 * Global error handler.
 */
app.use(
  (error, req, res, next) => {
    console.error(
      "Unhandled application error:",
      error
    );

    if (res.headersSent) {
      return next(error);
    }

    /*
     * CORS origin rejection.
     */
    if (
      error.message ===
      "CORS_ORIGIN_NOT_ALLOWED"
    ) {
      return res.status(403).json({
        error: {
          code:
            "CORS_ORIGIN_NOT_ALLOWED",
          message:
            "Request origin is not allowed"
        }
      });
    }

    /*
     * Invalid JSON.
     */
    if (
      error instanceof SyntaxError &&
      error.status === 400 &&
      error.type ===
        "entity.parse.failed"
    ) {
      return res.status(400).json({
        error: {
          code:
            "INVALID_JSON",
          message:
            "Request body contains invalid JSON"
        }
      });
    }

    /*
     * JSON body exceeded 1 MB.
     */
    if (
      error.type ===
      "entity.too.large"
    ) {
      return res.status(413).json({
        error: {
          code:
            "REQUEST_TOO_LARGE",
          message:
            "Request body is too large"
        }
      });
    }

    /*
     * Never expose internal error
     * details to API clients.
     */
    return res.status(500).json({
      error: {
        code:
          "INTERNAL_SERVER_ERROR",
        message:
          "An unexpected error occurred"
      }
    });
  }
);

module.exports = app;