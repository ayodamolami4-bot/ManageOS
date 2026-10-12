require("dotenv").config();
const pool = require("../src/db/database");
const { configuredStore, storageMode } = require("../src/utils/storageProvider");
const { processFileDeletions } = require("../src/services/fileDeletionService");

async function main() {
  // Refuse to run without private cloud credentials. Never delete from local disks
  // or use a production database accidentally with development storage.
  if (!process.env.DATABASE_URL || storageMode() === "local") {
    throw new Error("FILE_CLEANUP_CONFIGURATION_REQUIRED");
  }
  configuredStore();
  const result = await processFileDeletions({ limit: 50 });
  console.log("File deletion retry:", JSON.stringify(result));
  if (result.deferred > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("File cleanup could not complete:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => { process.exitCode = 1; });
  });
