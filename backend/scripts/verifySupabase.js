const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { createConfiguredSupabaseStore } = require("../src/utils/supabaseStorage");

async function main() {
  if (process.env.FILE_STORAGE_BACKEND !== "supabase") {
    throw new Error("Set FILE_STORAGE_BACKEND=supabase to verify private storage");
  }

  const store = createConfiguredSupabaseStore();
  await store.assertPrivateBucket();
  const id = crypto.randomUUID();
  const now = new Date();
  const storageKey = [
    "files",
    crypto.randomUUID(),
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    id + ".txt",
  ].join("/");
  const payload = Buffer.from("ManageOS private Supabase Storage check: " + id);
  let mayExist = false;

  try {
    mayExist = true;
    const expected = crypto.createHash("sha256").update(payload).digest("hex");
    assert.equal(await store.put(storageKey, payload, "text/plain"), expected);
    assert.deepEqual(await store.get(storageKey), payload);
    await store.delete(storageKey);
    mayExist = false;
    await assert.rejects(store.get(storageKey), /FILE_STORAGE_NOT_FOUND/);
    console.log("Supabase Storage verification passed: private write/read/delete/absence.");
  } finally {
    if (mayExist) {
      await store.delete(storageKey).catch(() => {
        console.error("Private storage test-object cleanup failed; check the test bucket.");
        process.exitCode = 1;
      });
    }
  }
}

main().catch((error) => {
  console.error("Private Supabase Storage verification failed:", error.message);
  process.exitCode = 1;
});
