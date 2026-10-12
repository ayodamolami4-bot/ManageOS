const { createHash } = require("node:crypto");
const { validateStorageKey, MAX_FILE_BYTES } = require("./r2Storage");

const REQUEST_TIMEOUT_MS = 30000;
const EXPECTED_BUCKET = "manageos-files";

/**
 * Private Supabase Storage adapter. We intentionally use no browser SDK:
 * the ManageOS backend authenticates users and authorizes each resource first.
 * API endpoints match Supabase Storage's standard upload/download/remove APIs.
 */
function createSupabaseStore({
  url,
  secretKey,
  bucket = EXPECTED_BUCKET,
  fetchImpl = fetch,
  timeoutMs = REQUEST_TIMEOUT_MS,
}) {
  let origin;
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      !/^[a-z0-9-]+\.supabase\.co$/i.test(parsed.hostname) ||
      parsed.username || parsed.password ||
      parsed.pathname !== "/" || parsed.search || parsed.hash
    ) {
      throw new Error("invalid");
    }
    origin = parsed.origin;
  } catch {
    throw new Error("FILE_STORAGE_NOT_CONFIGURED");
  }

  // New Supabase secret keys are preferred to legacy JWT service_role keys.
  if (
    typeof secretKey !== "string" ||
    !secretKey.startsWith("sb_secret_") ||
    secretKey.length < 20 ||
    bucket !== EXPECTED_BUCKET ||
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1000 || timeoutMs > 120000
  ) {
    throw new Error("FILE_STORAGE_NOT_CONFIGURED");
  }

  const baseUrl = origin + "/storage/v1/object/";
  const authenticatedHeaders = {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
    "User-Agent": "ManageOS-storage/1.0",
  };

  function fileUrl(key) {
    return baseUrl + encodeURIComponent(bucket) + "/" +
      validateStorageKey(key).split("/").map(encodeURIComponent).join("/");
  }

  async function call(method, endpoint, body, additionalHeaders = {}) {
    let response;
    try {
      response = await fetchImpl(endpoint, {
        method,
        headers: { ...authenticatedHeaders, ...additionalHeaders },
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new Error("FILE_STORAGE_UNAVAILABLE");
    }
    if (method === "GET" && response.status === 404) {
      throw new Error("FILE_STORAGE_NOT_FOUND");
    }
    if (!response.ok) {
      throw new Error("FILE_STORAGE_UNAVAILABLE");
    }
    return response;
  }

  return {
    async put(key, bytes, mimeType) {
      if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > MAX_FILE_BYTES) {
        throw new Error("FILE_TOO_LARGE");
      }
      const response = await call("POST", fileUrl(key), bytes, {
        "Content-Type": mimeType || "application/octet-stream",
        "x-upsert": "false",
        "cache-control": "max-age=0",
      });
      // The REST endpoint returns JSON with Key/Id, not a boolean success field.
      const result = await response.json().catch(() => null);
      if (!result?.Key) throw new Error("FILE_STORAGE_UNAVAILABLE");
      return createHash("sha256").update(bytes).digest("hex");
    },

    async get(key) {
      const response = await call("GET", fileUrl(key));
      const length = response.headers.get("content-length");
      if (length !== null && Number(length) > MAX_FILE_BYTES) {
        throw new Error("FILE_STORAGE_UNAVAILABLE");
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > MAX_FILE_BYTES) {
        throw new Error("FILE_STORAGE_UNAVAILABLE");
      }
      return bytes;
    },

    async delete(key) {
      // Supabase's documented remove operation uses DELETE /object/:bucket
      // with a JSON body of object path prefixes, not a per-object DELETE.
      const response = await call(
        "DELETE",
        baseUrl + encodeURIComponent(bucket),
        JSON.stringify({ prefixes: [validateStorageKey(key)] }),
        { "Content-Type": "application/json" }
      );
      const result = await response.json().catch(() => null);
      // Successful empty arrays mean that the object was already absent.
      if (!Array.isArray(result)) throw new Error("FILE_STORAGE_UNAVAILABLE");
    },
  };
}

function createConfiguredSupabaseStore(env = process.env) {
  return createSupabaseStore({
    url: env.SUPABASE_URL,
    secretKey: env.SUPABASE_SECRET_KEY,
    bucket: env.SUPABASE_STORAGE_BUCKET || EXPECTED_BUCKET,
  });
}

module.exports = {
  createSupabaseStore,
  createConfiguredSupabaseStore,
  EXPECTED_BUCKET,
};
