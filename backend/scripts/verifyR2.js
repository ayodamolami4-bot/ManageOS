const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { configuredStore } = require("../src/utils/r2Storage");

async function main() {
  if (process.env.FILE_STORAGE_BACKEND !== "r2") {
    throw new Error("Set FILE_STORAGE_BACKEND=r2 to verify real private storage");
  }

  const store = configuredStore();
  const companyId = crypto.randomUUID();
  const objectId = crypto.randomUUID();
  const now = new Date();
  const storageKey = [
    "files",
    companyId,
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    objectId + ".txt"
  ].join("/");
  const bytes = Buffer.from("ManageOS private storage round-trip " + objectId);
  let uploadAttempted = false;
  try {
    uploadAttempted = true;
    const expectedHash = crypto.createHash("sha256").update(bytes).digest("hex");
    assert.equal(await store.put(storageKey, bytes, "text/plain"), expectedHash);
    const downloaded = await store.get(storageKey);
    assert.deepEqual(downloaded, bytes);
    await store.delete(storageKey);
    uploadAttempted = false;
    await assert.rejects(store.get(storageKey), /FILE_STORAGE_NOT_FOUND/);
    console.log("R2 verification passed: private upload, download, delete and absence.");
  } finally {
    if (uploadAttempted) {
      await store.delete(storageKey).catch(() => {
        console.error("R2 test object cleanup failed; investigate the private test bucket.");
        process.exitCode = 1;
      });
    }
  }
}

main().catch((error) => {
  console.error("R2 live verification failed:", error.message);
  process.exitCode = 1;
});
