const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

test("production build serves real Vite assets, browser routes, and existing JSON API", {
  skip: process.env.RUN_PRODUCTION_SMOKE !== "1",
}, async () => {
  assert.equal(process.env.NODE_ENV, "production");
  const app = require("../src/app");
  const home = await request(app).get("/");
  assert.equal(home.status, 200);
  assert.match(home.headers["content-type"], /html/);
  assert.match(home.text, /<div id="root"><\/div>/);
  const deep = await request(app).get("/app/overview");
  assert.equal(deep.status, 200);
  assert.match(deep.text, /<div id="root"><\/div>/);
  const health = await request(app).get("/api/health");
  assert.equal(health.status, 200);
  assert.equal(health.body.status, "ok");
  const missingApi = await request(app).get("/api/does-not-exist");
  assert.equal(missingApi.status, 404);
  assert.equal(missingApi.body.error.code, "ROUTE_NOT_FOUND");
});
