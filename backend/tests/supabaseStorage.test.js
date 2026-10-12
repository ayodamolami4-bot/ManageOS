const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const {
  createSupabaseStore,
  createConfiguredSupabaseStore,
  EXPECTED_BUCKET
} = require("../src/utils/supabaseStorage");
const { storageMode, configuredStore } = require("../src/utils/storageProvider");

const config = {
  url: "https://example-ref.supabase.co",
  secretKey: "sb_secret_test_key_representing_a_secure_project_key",
  bucket: "manageos-files"
};
const key = "files/4323e3b6-5ad2-4ce5-8d29-83d34a76588d/2026/10/190746ca-7283-4b4c-9ee6-c1cadb147755.pdf";

test("production defaults to Supabase; missing or insecure credentials fail closed", () => {
  assert.equal(storageMode({ NODE_ENV: "test" }), "local");
  assert.equal(storageMode({ NODE_ENV: "production" }), "supabase");
  assert.equal(EXPECTED_BUCKET, "manageos-files");
  assert.throws(() => storageMode({ NODE_ENV: "production", FILE_STORAGE_BACKEND: "local" }), /FILE_STORAGE_NOT_CONFIGURED/);
  assert.throws(() => configuredStore({ NODE_ENV: "production" }), /FILE_STORAGE_NOT_CONFIGURED/);
  assert.throws(() => createSupabaseStore({ ...config, url: "http://example-ref.supabase.co" }), /SUPABASE_URL_INVALID_PROJECT_ORIGIN/);
  assert.throws(() => createSupabaseStore({ ...config, url: "https://evil.example.com" }), /SUPABASE_URL_INVALID_PROJECT_ORIGIN/);
  assert.throws(() => createSupabaseStore({ ...config, url: config.url + "/rest/v1" }), /SUPABASE_URL_INVALID_PROJECT_ORIGIN/);
  assert.throws(() => createSupabaseStore({ ...config, bucket: "public" }), /SUPABASE_STORAGE_BUCKET_INVALID/);
  assert.throws(() => createSupabaseStore({ ...config, secretKey: "sb_publishable_bad" }), /SUPABASE_SECRET_KEY_INVALID/);
  assert.ok(createConfiguredSupabaseStore({
    SUPABASE_URL: config.url,
    SUPABASE_SECRET_KEY: config.secretKey,
    SUPABASE_STORAGE_BUCKET: "manageos-files",
  }));
});

test("private Supabase Storage uses authenticated POST/GET/DELETE with no public URLs", async () => {
  const observed = [];
  const bytes = Buffer.from("hello-private-manageos");
  const mockFetch = async (url, options) => {
    observed.push({ url, options });
    switch (options.method) {
      case "POST":
        return new Response(JSON.stringify({ Key: "manageos-files/" + key, Id: "obj-id" }), { status: 200 });
      case "GET":
        return new Response(bytes, { status: 200, headers: { "content-length": String(bytes.length) } });
      case "DELETE":
        return new Response(JSON.stringify([{ bucket_id: "manageos-files", name: key }]), { status: 200 });
      default:
        throw new Error("Unexpected HTTP method");
    }
  };

  const store = createSupabaseStore({ ...config, fetchImpl: mockFetch });
  assert.equal(await store.put(key, bytes, "application/pdf"), crypto.createHash("sha256").update(bytes).digest("hex"));
  assert.deepEqual(await store.get(key), bytes);
  await store.delete(key);

  assert.deepEqual(observed.map((c) => c.options.method), ["POST", "GET", "DELETE"]);
  assert.equal(observed[0].url, config.url + "/storage/v1/object/manageos-files/" + key);
  assert.equal(observed[1].url, config.url + "/storage/v1/object/authenticated/manageos-files/" + key);
  assert.equal(observed[2].url, config.url + "/storage/v1/object/manageos-files");
  assert.equal(observed[0].options.headers.apikey, config.secretKey);
  assert.equal(observed[0].options.headers.Authorization, undefined);
  assert.equal(observed[0].options.headers["x-upsert"], "false");
  assert.equal(observed[0].options.headers["Content-Type"], "application/pdf");
  assert.equal(observed[0].options.body, bytes);
  assert.deepEqual(JSON.parse(observed[2].options.body), { prefixes: [key] });
});

test("missing remote object and repeated deletion do not leak credentials", async () => {
  const store = createSupabaseStore({
    ...config,
    fetchImpl: async (_url, options) => {
      if (options.method === "GET") return new Response("missing", { status: 404 });
      if (options.method === "DELETE") return new Response("[]", { status: 200 });
      return new Response("unavailable", { status: 503 });
    }
  });
  await assert.rejects(store.get(key), /FILE_STORAGE_NOT_FOUND/);
  await assert.doesNotReject(store.delete(key));
  await assert.rejects(store.put(key, Buffer.from("test"), "text/plain"), /FILE_STORAGE_UNAVAILABLE/);
});

test("oversized file, invalid path and provider network error fail safely", async () => {
  const unreachable = createSupabaseStore({ ...config, fetchImpl: async () => {
    throw new Error("unexpected secret provider trace");
  }});
  await assert.rejects(unreachable.get(key), (error) =>
    error.message === "FILE_STORAGE_UNAVAILABLE" &&
    !error.message.includes("secret provider trace")
  );
  await assert.rejects(unreachable.put(key, Buffer.alloc(10 * 1024 * 1024 + 1), "application/pdf"), /FILE_TOO_LARGE/);
  await assert.rejects(unreachable.get("../private-data"), /INVALID_STORAGE_KEY/);
  const tooLarge = createSupabaseStore({ ...config, fetchImpl: async () =>
    new Response(Buffer.alloc(0), { status: 200, headers: { "content-length": String(10 * 1024 * 1024 + 1) } })
  });
  await assert.rejects(tooLarge.get(key), /FILE_STORAGE_UNAVAILABLE/);
});

test("live bucket metadata must confirm a private bucket before uploading", async () => {
  const seen = [];
  const valid = createSupabaseStore({
    ...config,
    fetchImpl: async (url, opts) => {
      seen.push({ url, opts });
      return new Response(JSON.stringify({ id: "manageos-files", public: false }), { status: 200 });
    }
  });
  assert.equal(await valid.assertPrivateBucket(), true);
  assert.equal(seen[0].url, config.url + "/storage/v1/bucket/manageos-files");
  assert.equal(seen[0].opts.headers.Authorization, undefined);

  const publicBucket = createSupabaseStore({
    ...config,
    fetchImpl: async () => new Response(JSON.stringify({ id: "manageos-files", public: true }), { status: 200 })
  });
  await assert.rejects(publicBucket.assertPrivateBucket(), /FILE_STORAGE_NOT_PRIVATE/);
});

test("legacy Supabase 400 NoSuchKey means absent, never blanket-translate bad requests", async () => {
  for (const providerCode of ["NoSuchKey", "not_found"]) {
    const store = createSupabaseStore({
      ...config,
      fetchImpl: async () => new Response(JSON.stringify({ code: providerCode, message: "Object not found" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      })
    });
    await assert.rejects(store.get(key), /FILE_STORAGE_NOT_FOUND/);
  }

  for (const providerCode of ["InvalidJWT", "InvalidKey", "InvalidRequest"]) {
    const store = createSupabaseStore({
      ...config,
      fetchImpl: async () => new Response(JSON.stringify({ code: providerCode, message: "Invalid or unauthorized" }), {
        status: 400,
        headers: { "content-type": "application/json" }
      })
    });
    await assert.rejects(store.get(key), /FILE_STORAGE_UNAVAILABLE/);
  }
});

test("Supabase legacy missing-object format with statusCode and error is handled", async () => {
  const store = createSupabaseStore({
    ...config,
    fetchImpl: async () => new Response(
      JSON.stringify({ statusCode: "404", error: "not_found", message: "Object not found" }),
      { status: 400, headers: { "content-type": "application/json" } }
    )
  });
  await assert.rejects(store.get(key), /FILE_STORAGE_NOT_FOUND/);
});
