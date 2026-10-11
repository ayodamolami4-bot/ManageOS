const test =
  require("node:test");

const assert =
  require("node:assert/strict");

const request =
  require("supertest");

const app =
  require("../src/app");

test(
  "health endpoint returns 200",
  async () => {
    const response =
      await request(app)
        .get("/api/health");

    assert.equal(
      response.status,
      200
    );

    assert.equal(
      response.body.status,
      "ok"
    );

    assert.equal(
      response.body.message,
      "ManageOS backend is running"
    );
  }
);

test(
  "unknown API route returns 404",
  async () => {
    const response =
      await request(app)
        .get(
          "/api/this-route-does-not-exist"
        );

    assert.equal(
      response.status,
      404
    );

    assert.equal(
      response.body.error.code,
      "ROUTE_NOT_FOUND"
    );
  }
);

test(
  "CSRF endpoint returns a token",
  async () => {
    const response =
      await request(app)
        .get("/api/auth/csrf");

    assert.equal(
      response.status,
      200
    );

    assert.equal(
      typeof response.body.data.csrfToken,
      "string"
    );

    assert.equal(
      response.body.data.csrfToken.length,
      64
    );

    const cookies =
      response.headers["set-cookie"];

    assert.ok(
      cookies,
      "Expected CSRF cookie to be set"
    );

    assert.ok(
      cookies.some(
        (cookie) =>
          cookie.startsWith(
            "csrf_token="
          )
      ),
      "Expected csrf_token cookie"
    );
  }
);