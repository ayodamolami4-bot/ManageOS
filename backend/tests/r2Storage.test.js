const test = require("node:test");
const assert = require("node:assert/strict");
const {
  MAX_FILE_BYTES,
  createR2Store,
  validateStorageKey,
  configuredStore,
  storageMode
} = require("../src/utils/r2Storage");

const key = "files/4323e3b6-5ad2-4ce5-8d29-83d34a76588d/2026/10/190746ca-7283-4b4c-9ee6-c1cadb147755.pdf";
const config = { accountId: "a".repeat(32), bucket: "manageos-demo", token: "private-r2-token" };

test("R2 is mandatory for production; local disk remains available for tests", () => {
  assert.equal(storageMode({ NODE_ENV: "test" }), "local");
  assert.equal(storageMode({ NODE_ENV: "production" }), "r2");
  assert.throws(() => storageMode({ NODE_ENV: "production", FILE_STORAGE_BACKEND: "local" }), /FILE_STORAGE_NOT_CONFIGURED/);
  assert.throws(() => configuredStore({ NODE_ENV: "production" }), /FILE_STORAGE_NOT_CONFIGURED/);
});

test("storage keys are restricted to generated company-scoped object paths", () => {
  assert.equal(validateStorageKey(key), key);
  for (const unsafe of [
    "../secret", "/etc/passwd", "https://example.org/",
    "files/../other", "files/not-a-company/2026/10/file.png",
    "files/4323e3b6-5ad2-4ce5-8d29-83d34a76588d/2026/10/%2F.png"
  ]) {
    assert.throws(() => validateStorageKey(unsafe), /INVALID_STORAGE_KEY/);
  }
});

test("R2 uses authenticated private PUT/GET/DELETE and preserves bytes", async () => {
  const calls = [];
  const payload = Buffer.from("PDF-TEST");
  const mockFetch = async (url, options) => {
    calls.push({ url, options });
    if (options.method === "GET") {
      return new Response(payload, { status: 200, headers: { "content-length": String(payload.length) } });
    }
    return new Response(JSON.stringify({ success: true, result: { key } }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  };
  const store = createR2Store({ ...config, fetchImpl: mockFetch });
  const checksum = await store.put(key, payload, "application/pdf");
  assert.equal(checksum, require("node:crypto").createHash("sha256").update(payload).digest("hex"));
  assert.deepEqual(await store.get(key), payload);
  await store.delete(key);
  assert.deepEqual(calls.map((call) => call.options.method), ["PUT", "GET", "DELETE"]);
  assert.equal(calls[0].options.headers.Authorization, "Bearer private-r2-token");
  assert.equal(calls[0].options.headers["Content-Type"], "application/pdf");
  assert.equal(calls[0].options.body, payload);
  assert.match(calls[0].url, /^https:\/\/api\.cloudflare\.com\/client\/v4\/accounts\/a{32}\/r2\/buckets\/manageos-demo\/objects\/files\//);
  assert.ok(calls[0].url.endsWith(".pdf"));
});

test("R2 rejects bad configuration, oversize payloads, and failed requests", async () => {
  assert.throws(() => createR2Store({ ...config, accountId: "https://example.com" }), /FILE_STORAGE_NOT_CONFIGURED/);
  assert.throws(() => createR2Store({ ...config, bucket: "../bucket" }), /FILE_STORAGE_NOT_CONFIGURED/);
  const failFetch = async () => new Response(JSON.stringify({ success: false }), { status: 403 });
  const store = createR2Store({ ...config, fetchImpl: failFetch });
  await assert.rejects(store.put(key, Buffer.from("test"), "application/pdf"), /FILE_STORAGE_UNAVAILABLE/);
  await assert.rejects(store.put(key, Buffer.alloc(MAX_FILE_BYTES + 1), "application/pdf"), /FILE_TOO_LARGE/);
  assert.throws(() => validateStorageKey("outside/private.pdf"), /INVALID_STORAGE_KEY/);
  const missing = createR2Store({ ...config, fetchImpl: async () => new Response("", { status: 404 }) });
  await assert.rejects(missing.get(key), /FILE_STORAGE_NOT_FOUND/);
  const unavailable = createR2Store({ ...config, fetchImpl: async () => { throw new Error("DO NOT LEAK TOKEN"); } });
  await assert.rejects(unavailable.get(key), (err) =>
    err.message === "FILE_STORAGE_UNAVAILABLE" && !err.message.includes("TOKEN")
  );
});

test("R2 cleanup treats a previously removed object as successful", async () => {
  const gone = createR2Store({ ...config, fetchImpl: async () => new Response("", { status: 404 }) });
  await assert.doesNotReject(gone.delete(key));
});
