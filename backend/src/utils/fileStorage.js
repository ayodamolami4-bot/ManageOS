const fs = require("fs");
const fsPromises = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const STORAGE_ROOT = path.resolve(
  __dirname,
  "../../storage"
);

const TEMP_ROOT = path.join(
  STORAGE_ROOT,
  "tmp"
);

fs.mkdirSync(STORAGE_ROOT, {
  recursive: true
});

fs.mkdirSync(TEMP_ROOT, {
  recursive: true
});

function getExtension(originalName) {
  return path.extname(
    originalName || ""
  ).toLowerCase();
}

function generateStorageKey(
  companyId,
  originalName
) {
  const now = new Date();

  const year = now.getUTCFullYear();

  const month = String(
    now.getUTCMonth() + 1
  ).padStart(2, "0");

  const extension =
    getExtension(originalName);

  return path.posix.join(
    "files",
    companyId,
    String(year),
    month,
    `${crypto.randomUUID()}${extension}`
  );
}

function resolveStoragePath(storageKey) {
  const resolvedRoot = path.resolve(
    STORAGE_ROOT
  );

  const resolvedPath = path.resolve(
    STORAGE_ROOT,
    storageKey
  );

  if (
    resolvedPath !== resolvedRoot &&
    !resolvedPath.startsWith(
      `${resolvedRoot}${path.sep}`
    )
  ) {
    throw new Error(
      "INVALID_STORAGE_KEY"
    );
  }

  return resolvedPath;
}

async function moveToPermanentStorage(
  tempPath,
  storageKey
) {
  const destination =
    resolveStoragePath(storageKey);

  await fsPromises.mkdir(
    path.dirname(destination),
    {
      recursive: true
    }
  );

  await fsPromises.rename(
    tempPath,
    destination
  );

  return destination;
}

async function deleteStoredFile(
  storageKey
) {
  try {
    const filePath =
      resolveStoragePath(storageKey);

    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function deleteTemporaryFile(
  filePath
) {
  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

function calculateSha256(filePath) {
  return new Promise(
    (resolve, reject) => {
      const hash =
        crypto.createHash("sha256");

      const stream =
        fs.createReadStream(filePath);

      stream.on("data", (chunk) => {
        hash.update(chunk);
      });

      stream.on("end", () => {
        resolve(
          hash.digest("hex")
        );
      });

      stream.on("error", reject);
    }
  );
}

module.exports = {
  STORAGE_ROOT,
  TEMP_ROOT,
  getExtension,
  generateStorageKey,
  resolveStoragePath,
  moveToPermanentStorage,
  deleteStoredFile,
  deleteTemporaryFile,
  calculateSha256
};