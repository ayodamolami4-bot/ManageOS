const { createHash } = require("node:crypto");

// Cloudflare's authenticated R2 REST API supports small object PUT/GET/DELETE.
// No bucket URL, object credentials or secrets are ever exposed to browsers.
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 30_000;

function validateStorageKey(key) {
  if (
    typeof key !== "string" ||
    !/^files\/[0-9a-f-]{36}\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.[a-z0-9]{1,12}$/i.test(key) ||
    key.includes("..")
  ) {
    throw new Error("INVALID_STORAGE_KEY");
  }
  return key;
}

function createR2Store({
  accountId,
  bucket,
  token,
  fetchImpl = fetch,
  timeoutMs = REQUEST_TIMEOUT_MS,
}) {
  if (!/^[0-9a-f]{32}$/i.test(String(accountId || "")) ||
      !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(String(bucket || "")) ||
      typeof token !== "string" || !token.trim()) {
    throw new Error("FILE_STORAGE_NOT_CONFIGURED");
  }
  const prefix = "https://api.cloudflare.com/client/v4/accounts/" +
    accountId + "/r2/buckets/" + bucket + "/objects/";

  function objectUrl(key) {
    // Slashes in an R2 object key are literal, never encoded as %2F.
    return prefix + validateStorageKey(key).split("/").map(encodeURIComponent).join("/");
  }

  async function call(method, key, body, mimeType) {
    const headers = { Authorization: "Bearer " + token };
    if (mimeType) headers["Content-Type"] = mimeType;

    let response;
    try {
      response = await fetchImpl(objectUrl(key), {
        method,
        headers,
        body,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      // Do not reveal the token, object key or vendor errors to API callers.
      throw new Error("FILE_STORAGE_UNAVAILABLE");
    }
    if (response.status === 404 && method === "GET") {
      throw new Error("FILE_STORAGE_NOT_FOUND");
    }
    // Remote deletion is idempotent: already missing means cleanup succeeded.
    if (response.status === 404 && method === "DELETE") return null;
    if (!response.ok) {
      throw new Error("FILE_STORAGE_UNAVAILABLE");
    }
    return response;
  }

  return {
    async put(key, bytes, mimeType) {
      if (!Buffer.isBuffer(bytes) || bytes.length > MAX_FILE_BYTES) {
        throw new Error("FILE_TOO_LARGE");
      }
      const response = await call("PUT", key, bytes, mimeType);
      const result = await response.json().catch(() => null);
      if (!result?.success) throw new Error("FILE_STORAGE_UNAVAILABLE");
      return createHash("sha256").update(bytes).digest("hex");
    },
    async get(key) {
      const response = await call("GET", key);
      const size = Number(response.headers.get("content-length"));
      if (Number.isFinite(size) && size > MAX_FILE_BYTES) {
        throw new Error("FILE_STORAGE_UNAVAILABLE");
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > MAX_FILE_BYTES) throw new Error("FILE_STORAGE_UNAVAILABLE");
      return bytes;
    },
    async delete(key) {
      const response = await call("DELETE", key);
      if (response === null) return; // Already absent; safe to retry.
      const result = await response.json().catch(() => null);
      if (!result?.success) throw new Error("FILE_STORAGE_UNAVAILABLE");
    }
  };
}

module.exports = {
  MAX_FILE_BYTES,
  validateStorageKey,
  createR2Store,
};
