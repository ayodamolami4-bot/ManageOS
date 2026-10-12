const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const express = require("express");
const request = require("supertest");
const { serveFrontend } = require("../src/middleware/serveFrontend");

test("refuses production startup when React build is missing", () => {
  const app = express();
  const missing = path.join(os.tmpdir(), "manageos-missing-production-build");
  assert.throws(
    () => serveFrontend(app, missing),
    /FRONTEND_BUILD_MISSING/
  );
});

test("serves SPA deep links without swallowing unknown API requests", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "manageos-spa-"));
  try {
    fs.mkdirSync(path.join(dir, "assets"));
    fs.writeFileSync(path.join(dir, "index.html"), "<html><body>ManageOS example</body></html>");
    fs.writeFileSync(path.join(dir, "assets", "app.js"), "console.log('manageos');");
    const app = express();
    app.get("/api/health", (req, res) => res.json({ status: "ok" }));
    serveFrontend(app, dir);
    app.use((req, res) => res.status(404).json({ error: { code: "ROUTE_NOT_FOUND" } }));

    const root = await request(app).get("/");
    assert.equal(root.status, 200);
    assert.match(root.text, /ManageOS example/);

    const deep = await request(app).get("/app/projects/29d0a2b3-6103-4d8c-a10e-d88c54e3cf5d");
    assert.equal(deep.status, 200);
    assert.match(deep.text, /ManageOS example/);

    const asset = await request(app).get("/assets/app.js");
    assert.equal(asset.status, 200);
    assert.match(asset.text, /manageos/);

    const health = await request(app).get("/api/health");
    assert.equal(health.body.status, "ok");

    const invalidApi = await request(app).get("/api/no-such-endpoint");
    assert.equal(invalidApi.status, 404);
    assert.equal(invalidApi.body.error.code, "ROUTE_NOT_FOUND");

    const invalidAsset = await request(app).get("/assets/missing.js");
    assert.equal(invalidAsset.status, 404);
    assert.equal(invalidAsset.body.error.code, "ROUTE_NOT_FOUND");

    const jsonOnly = await request(app).get("/no-such-resource").set("Accept", "application/json");
    assert.equal(jsonOnly.status, 404);
    const post = await request(app).post("/app/overview");
    assert.equal(post.status, 404);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
