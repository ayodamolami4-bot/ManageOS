const fs = require("node:fs/promises");
const {
  moveToPermanentStorage,
  calculateSha256,
  resolveStoragePath,
  deleteStoredFile,
  deleteTemporaryFile
} = require("./fileStorage");
const { MAX_FILE_BYTES } = require("./r2Storage");
const { storageMode, configuredStore } = require("./storageProvider");

async function persistFile({ tempPath, storageKey, mimeType }) {
  if (storageMode() === "local") {
    const destination = await moveToPermanentStorage(tempPath, storageKey);
    return calculateSha256(destination);
  }

  const store = configuredStore();
  const stats = await fs.stat(tempPath);
  if (stats.size > MAX_FILE_BYTES) throw new Error("FILE_TOO_LARGE");

  const bytes = await fs.readFile(tempPath);
  const checksum = await store.put(storageKey, bytes, mimeType);

  // Remote object is safely stored; failing to remove a temporary copy
  // should not roll back the successful upload or create an orphan.
  await deleteTemporaryFile(tempPath).catch((error) => {
    console.error("Temporary cloud upload cleanup failed:", error);
  });
  return checksum;
}

async function retrieveFile(storageKey) {
  if (storageMode() === "local") {
    const storagePath = resolveStoragePath(storageKey);
    try {
      await fs.access(storagePath);
    } catch {
      throw new Error("FILE_STORAGE_NOT_FOUND");
    }
    return { storagePath };
  }
  return { body: await configuredStore().get(storageKey) };
}

async function removeStoredFile(storageKey) {
  if (storageMode() === "local") {
    return deleteStoredFile(storageKey);
  }
  return configuredStore().delete(storageKey);
}

module.exports = { persistFile, retrieveFile, removeStoredFile };
