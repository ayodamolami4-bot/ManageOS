const { createHash } = require("node:crypto");
const { configuredStore } = require("../utils/storageProvider");
const { DEMO_NAME } = require("../config/publicDemo");
const repo = require("../repositories/publicDemoRepository");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function unavailable() {
  const error = new Error("DEMO_NOT_FOUND");
  error.status = 404;
  return error;
}

async function ensureDemoExists() {
  if (!(await repo.exists())) throw unavailable();
}

async function overview() {
  await ensureDemoExists();
  return { company: DEMO_NAME, fictional: true, mode: "public-read-only", ...(await repo.getOverviewData()) };
}

async function document(fileId) {
  if (!UUID.test(String(fileId || ""))) throw unavailable();
  await ensureDemoExists();
  const file = await repo.findApprovedDocument(fileId);
  if (!file) throw unavailable();
  const store = configuredStore();
  if (!store) throw new Error("DEMO_STORAGE_UNAVAILABLE");
  const bytes = await store.get(file.storage_key);
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (bytes.length !== Number(file.size_bytes) || digest !== String(file.checksum_sha256 || "").trim()) {
    throw new Error("DEMO_FILE_INTEGRITY_FAILURE");
  }
  return { filename: file.original_name, bytes };
}

module.exports = { overview, document };
