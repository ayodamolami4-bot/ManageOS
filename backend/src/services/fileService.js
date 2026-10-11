const pool = require("../db/database");

const {
  createFileWithClient,
  getFilesByResource,
  getFileById,
  deleteFileWithClient
} = require("../repositories/fileRepository");

const {
  generateStorageKey,
  moveToPermanentStorage,
  deleteStoredFile,
  deleteTemporaryFile,
  calculateSha256,
  resolveStoragePath
} = require("../utils/fileStorage");

const {
  validateFileContent
} = require("../utils/fileContentValidator");

const {
  canManageProject,
  canViewProject,
  canViewTask
} = require("./authorizationService");

const fsPromises = require("fs/promises");
const path = require("path");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SUPPORTED_RESOURCES = [
  "PROJECT",
  "TASK"
];

function normalizeResourceType(
  resourceType
) {
  const value = String(
    resourceType || ""
  )
    .trim()
    .toUpperCase();

  if (
    !SUPPORTED_RESOURCES.includes(
      value
    )
  ) {
    throw new Error(
      "INVALID_RESOURCE_TYPE"
    );
  }

  return value;
}

function validateUuid(value) {
  return UUID_REGEX.test(
    String(value || "")
  );
}

async function verifyResourceBelongsToCompany(
  resourceType,
  resourceId,
  companyId
) {
  if (!validateUuid(resourceId)) {
    throw new Error(
      "INVALID_FILE_REFERENCE"
    );
  }

  let result;

  if (
    resourceType === "PROJECT"
  ) {
    result = await pool.query(
      `
      SELECT id
      FROM projects
      WHERE id = $1
        AND company_id = $2
      LIMIT 1
      `,
      [
        resourceId,
        companyId
      ]
    );
  }

  if (
    resourceType === "TASK"
  ) {
    result = await pool.query(
      `
      SELECT id
      FROM tasks
      WHERE id = $1
        AND company_id = $2
      LIMIT 1
      `,
      [
        resourceId,
        companyId
      ]
    );
  }

  if (
    !result ||
    result.rows.length === 0
  ) {
    throw new Error(
      "RESOURCE_NOT_FOUND"
    );
  }
}

async function getProjectIdForResource(
  resourceType,
  resourceId,
  companyId
) {
  if (
    resourceType === "PROJECT"
  ) {
    const result =
      await pool.query(
        `
        SELECT id
        FROM projects
        WHERE id = $1
          AND company_id = $2
        LIMIT 1
        `,
        [
          resourceId,
          companyId
        ]
      );

    if (
      result.rows.length === 0
    ) {
      throw new Error(
        "RESOURCE_NOT_FOUND"
      );
    }

    return result.rows[0].id;
  }

  if (
    resourceType === "TASK"
  ) {
    const result =
      await pool.query(
        `
        SELECT project_id
        FROM tasks
        WHERE id = $1
          AND company_id = $2
        LIMIT 1
        `,
        [
          resourceId,
          companyId
        ]
      );

    if (
      result.rows.length === 0
    ) {
      throw new Error(
        "RESOURCE_NOT_FOUND"
      );
    }

    return result.rows[0]
      .project_id;
  }

  throw new Error(
    "INVALID_RESOURCE_TYPE"
  );
}

async function requireFileResourceAccess(resourceType, resourceId, user) {
  const allowed = resourceType === "PROJECT"
    ? await canViewProject(user, resourceId)
    : await canViewTask(user, resourceId);

  if (!allowed) throw new Error("FILE_ACCESS_FORBIDDEN");
}

function toPublicFile(file) {
  return {
    id: file.id,
    company_id:
      file.company_id,
    uploaded_by:
      file.uploaded_by,
    resource_type:
      file.resource_type,
    resource_id:
      file.resource_id,
    original_name:
      file.original_name,
    mime_type:
      file.mime_type,
    size_bytes:
      file.size_bytes,
    checksum_sha256:
      file.checksum_sha256,
    created_at:
      file.created_at,
    updated_at:
      file.updated_at
  };
}

async function uploadFile(
  {
    resourceType,
    resourceId,
    file
  },
  user
) {
  if (!file) {
    throw new Error(
      "FILE_REQUIRED"
    );
  }

  const normalizedType =
    normalizeResourceType(
      resourceType
    );

  try {
    await verifyResourceBelongsToCompany(
      normalizedType,
      resourceId,
      user.company_id
    );
    await requireFileResourceAccess(normalizedType, resourceId, user);
  } catch (error) {
    // Multer has already placed the upload in temporary storage.
    await deleteTemporaryFile(file.path).catch((cleanupError) => {
      console.error("Temporary upload cleanup failed:", cleanupError);
    });
    throw error;
  }

  const originalName =
    path.basename(
      file.originalname
    );

  const storageKey =
    generateStorageKey(
      user.company_id,
      originalName
    );

  let movedToPermanent = false;
  let client;

  try {
    /*
     * The file is still in temporary storage
     * at this point.
     *
     * Verify the actual file contents before
     * allowing it into permanent storage.
     */
    await validateFileContent(
      file.path,
      originalName
    );

    /*
     * Only a content-validated file is
     * moved into permanent storage.
     */
    await moveToPermanentStorage(
      file.path,
      storageKey
    );

    movedToPermanent = true;

    const storagePath =
      resolveStoragePath(
        storageKey
      );

    /*
     * Calculate the checksum from the
     * exact file that was stored.
     */
    const checksumSha256 =
      await calculateSha256(
        storagePath
      );

    client =
      await pool.connect();

    await client.query(
      "BEGIN"
    );

    const createdFile =
      await createFileWithClient(
        client,
        {
          companyId:
            user.company_id,
          uploadedBy:
            user.id,
          resourceType:
            normalizedType,
          resourceId,
          originalName,
          storageKey,
          mimeType:
            file.mimetype,
          sizeBytes:
            file.size,
          checksumSha256
        }
      );

    await client.query(
      "COMMIT"
    );

    return toPublicFile(
      createdFile
    );
  } catch (error) {
    if (client) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "File transaction rollback failed:",
          rollbackError
        );
      }
    }

    /*
     * Clean up the physical file
     * regardless of where the failure happened.
     */
    if (movedToPermanent) {
      try {
        await deleteStoredFile(
          storageKey
        );
      } catch (cleanupError) {
        console.error(
          "Stored file cleanup failed:",
          cleanupError
        );
      }
    } else {
      try {
        await deleteTemporaryFile(
          file.path
        );
      } catch (cleanupError) {
        console.error(
          "Temporary file cleanup failed:",
          cleanupError
        );
      }
    }

    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function getFiles(
  {
    resourceType,
    resourceId
  },
  user
) {
  const normalizedType =
    normalizeResourceType(
      resourceType
    );

  await verifyResourceBelongsToCompany(
    normalizedType,
    resourceId,
    user.company_id
  );
  await requireFileResourceAccess(normalizedType, resourceId, user);

  const files =
    await getFilesByResource(
      user.company_id,
      normalizedType,
      resourceId
    );

  return files.map(
    toPublicFile
  );
}

async function getFile(
  fileId,
  user
) {
  if (
    !validateUuid(fileId)
  ) {
    throw new Error(
      "INVALID_FILE_REFERENCE"
    );
  }

  const file =
    await getFileById(
      user.company_id,
      fileId
    );

  if (!file) {
    throw new Error("FILE_NOT_FOUND");
  }
  await requireFileResourceAccess(file.resource_type, file.resource_id, user);

  return toPublicFile(file);
}

async function getFileForDownload(
  fileId,
  user
) {
  if (
    !validateUuid(fileId)
  ) {
    throw new Error(
      "INVALID_FILE_REFERENCE"
    );
  }

  const file =
    await getFileById(
      user.company_id,
      fileId
    );

  if (!file) {
    throw new Error(
      "FILE_NOT_FOUND"
    );
  }

  await requireFileResourceAccess(file.resource_type, file.resource_id, user);

  const storagePath =
    resolveStoragePath(
      file.storage_key
    );

  try {
    await fsPromises.access(
      storagePath
    );
  } catch (error) {
    console.error(
      "Stored file missing:",
      error
    );

    throw new Error(
      "FILE_STORAGE_NOT_FOUND"
    );
  }

  return {
    file,
    storagePath
  };
}

async function deleteFile(
  fileId,
  user
) {
  if (
    !validateUuid(fileId)
  ) {
    throw new Error(
      "INVALID_FILE_REFERENCE"
    );
  }

  const existingFile =
    await getFileById(
      user.company_id,
      fileId
    );

  if (!existingFile) {
    throw new Error(
      "FILE_NOT_FOUND"
    );
  }

  await requireFileResourceAccess(existingFile.resource_type, existingFile.resource_id, user);

  const isUploader =
    existingFile.uploaded_by ===
    user.id;

  let canDelete =
    isUploader;

  if (!canDelete) {
    const projectId =
      await getProjectIdForResource(
        existingFile.resource_type,
        existingFile.resource_id,
        user.company_id
      );

    canDelete =
      await canManageProject(
        user,
        projectId
      );
  }

  if (!canDelete) {
    throw new Error(
      "FILE_DELETE_FORBIDDEN"
    );
  }

  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    const deletedFile =
      await deleteFileWithClient(
        client,
        {
          companyId:
            user.company_id,
          fileId,
          actorId:
            user.id
        }
      );

    await client.query(
      "COMMIT"
    );

    try {
      await deleteStoredFile(
        deletedFile.storage_key
      );
    } catch (storageError) {
      console.error(
        "Physical file deletion failed:",
        storageError
      );
    }

    return toPublicFile(
      deletedFile
    );
  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  uploadFile,
  getFiles,
  getFile,
  getFileForDownload,
  deleteFile
};