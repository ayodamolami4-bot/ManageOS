const pool = require("../db/database");

const {
  createActivityWithClient
} = require("./activityRepository");

async function createFileWithClient(
  client,
  {
    companyId,
    uploadedBy,
    resourceType,
    resourceId,
    originalName,
    storageKey,
    mimeType,
    sizeBytes,
    checksumSha256
  }
) {
  const result = await client.query(
    `
    INSERT INTO files (
      company_id,
      uploaded_by,
      resource_type,
      resource_id,
      original_name,
      storage_key,
      mime_type,
      size_bytes,
      checksum_sha256
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9
    )
    RETURNING *
    `,
    [
      companyId,
      uploadedBy,
      resourceType,
      resourceId,
      originalName,
      storageKey,
      mimeType,
      sizeBytes,
      checksumSha256
    ]
  );

  const file =
    result.rows[0];

  await createActivityWithClient(
    client,
    {
      companyId,
      actorId: uploadedBy,
      action: "FILE_UPLOADED",
      resourceType: "FILE",
      resourceId: file.id,
      metadata: {
        resource_type: resourceType,
        resource_id: resourceId,
        original_name: originalName,
        mime_type: mimeType,
        size_bytes: sizeBytes
      }
    }
  );

  await client.query(
    `
    INSERT INTO audit_logs (
      company_id,
      actor_id,
      action,
      resource_type,
      resource_id,
      old_values,
      new_values,
      metadata
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8
    )
    `,
    [
      companyId,
      uploadedBy,
      "FILE_UPLOADED",
      "FILE",
      file.id,
      null,
      JSON.stringify({
        original_name: originalName,
        mime_type: mimeType,
        size_bytes: sizeBytes,
        resource_type: resourceType,
        resource_id: resourceId
      }),
      JSON.stringify({
        storage_key: storageKey,
        checksum_sha256: checksumSha256
      })
    ]
  );

  return file;
}

async function getFilesByResource(
  companyId,
  resourceType,
  resourceId
) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      uploaded_by,
      resource_type,
      resource_id,
      original_name,
      storage_key,
      mime_type,
      size_bytes,
      checksum_sha256,
      created_at,
      updated_at
    FROM files
    WHERE company_id = $1
      AND resource_type = $2
      AND resource_id = $3
    ORDER BY created_at DESC
    `,
    [
      companyId,
      resourceType,
      resourceId
    ]
  );

  return result.rows;
}

async function getFileById(
  companyId,
  fileId
) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      uploaded_by,
      resource_type,
      resource_id,
      original_name,
      storage_key,
      mime_type,
      size_bytes,
      checksum_sha256,
      created_at,
      updated_at
    FROM files
    WHERE id = $1
      AND company_id = $2
    LIMIT 1
    `,
    [
      fileId,
      companyId
    ]
  );

  return result.rows[0];
}

async function getFileByIdWithClient(
  client,
  companyId,
  fileId
) {
  const result = await client.query(
    `
    SELECT
      id,
      company_id,
      uploaded_by,
      resource_type,
      resource_id,
      original_name,
      storage_key,
      mime_type,
      size_bytes,
      checksum_sha256,
      created_at,
      updated_at
    FROM files
    WHERE id = $1
      AND company_id = $2
    LIMIT 1
    FOR UPDATE
    `,
    [
      fileId,
      companyId
    ]
  );

  return result.rows[0];
}

async function deleteFileWithClient(
  client,
  {
    companyId,
    fileId,
    actorId
  }
) {
  const existingFile =
    await getFileByIdWithClient(
      client,
      companyId,
      fileId
    );

  if (!existingFile) {
    throw new Error(
      "FILE_NOT_FOUND"
    );
  }

  const result =
    await client.query(
      `
      DELETE FROM files
      WHERE id = $1
        AND company_id = $2
      RETURNING *
      `,
      [
        fileId,
        companyId
      ]
    );

  const deletedFile =
    result.rows[0];

  await createActivityWithClient(
    client,
    {
      companyId,
      actorId,
      action: "FILE_DELETED",
      resourceType: "FILE",
      resourceId: fileId,
      metadata: {
        original_name:
          existingFile.original_name,
        resource_type:
          existingFile.resource_type,
        resource_id:
          existingFile.resource_id
      }
    }
  );

  await client.query(
    `
    INSERT INTO audit_logs (
      company_id,
      actor_id,
      action,
      resource_type,
      resource_id,
      old_values,
      new_values,
      metadata
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8
    )
    `,
    [
      companyId,
      actorId,
      "FILE_DELETED",
      "FILE",
      fileId,
      JSON.stringify({
        original_name:
          existingFile.original_name,
        mime_type:
          existingFile.mime_type,
        size_bytes:
          existingFile.size_bytes,
        resource_type:
          existingFile.resource_type,
        resource_id:
          existingFile.resource_id
      }),
      null,
      JSON.stringify({
        storage_key:
          existingFile.storage_key
      })
    ]
  );

  return deletedFile;
}

module.exports = {
  createFileWithClient,
  getFilesByResource,
  getFileById,
  getFileByIdWithClient,
  deleteFileWithClient
};