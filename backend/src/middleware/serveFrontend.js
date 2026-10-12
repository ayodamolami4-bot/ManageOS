const express = require("express");
const fs = require("node:fs");
const path = require("node:path");

/*
 * Serve the production React build from the API origin.
 * A single origin avoids third-party-cookie and CSRF problems for sessions.
 * Vite handles this separately during local development.
 */
function serveFrontend(app, buildDirectory) {
  const indexPath = path.join(buildDirectory, "index.html");
  if (!fs.existsSync(indexPath)) {
    throw new Error("FRONTEND_BUILD_MISSING: build the frontend before starting production.");
  }

  app.use(express.static(buildDirectory, {
    index: false,
    maxAge: "1h",
  }));

  // BrowserRouter deep links should load the SPA; unknown API paths must stay JSON 404s.
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path === "/api" || req.path.startsWith("/api/")) return next();
    if (path.extname(req.path) || !req.accepts("html")) return next();

    res.set("Cache-Control", "no-cache");
    return res.sendFile(indexPath);
  });
}

module.exports = { serveFrontend };
