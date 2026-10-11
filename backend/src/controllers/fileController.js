const {
  uploadFile,
  getFiles,
  getFile,
  getFileForDownload,
  deleteFile
} = require("../services/fileService");

async function upload(
  req,
  res
) {
  try {
    const file =
      await uploadFile(
        {
          resourceType:
            req.body.resourceType,

          resourceId:
            req.body.resourceId,

          file:
            req.file
        },
        req.user
      );

    res.status(201).json({
      data: file,
      message:
        "File uploaded successfully"
    });
  } catch (error) {
    console.error(
      "File upload failed:",
      error
    );

    if (
      error.message ===
        "FILE_REQUIRED" ||
      error.message ===
        "INVALID_RESOURCE_TYPE" ||
      error.message ===
        "INVALID_FILE_REFERENCE" ||
      error.message ===
        "UNSUPPORTED_FILE_TYPE" ||
      error.message ===
        "FILE_CONTENT_MISMATCH"
    ) {
      return res.status(400).json({
        error: {
          code:
            error.message,

          message:
            "Invalid file type or file contents"
        }
      });
    }

    if (
      error.message ===
      "RESOURCE_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "RESOURCE_NOT_FOUND",

          message:
            "The target resource was not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "FILE_UPLOAD_FAILED",

        message:
          "Unable to upload file"
      }
    });
  }
}

async function getCompanyFiles(
  req,
  res
) {
  try {
    const files =
      await getFiles(
        {
          resourceType:
            req.query.resourceType,

          resourceId:
            req.query.resourceId
        },
        req.user
      );

    res.status(200).json({
      data: files,
      message:
        "Files retrieved successfully"
    });
  } catch (error) {
    console.error(
      "File retrieval failed:",
      error
    );

    if (
      error.message ===
        "INVALID_RESOURCE_TYPE" ||
      error.message ===
        "INVALID_FILE_REFERENCE"
    ) {
      return res.status(400).json({
        error: {
          code:
            error.message,

          message:
            "Invalid file resource reference"
        }
      });
    }

    if (
      error.message ===
      "RESOURCE_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "RESOURCE_NOT_FOUND",

          message:
            "The target resource was not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "FILES_RETRIEVAL_FAILED",

        message:
          "Unable to retrieve files"
      }
    });
  }
}

async function getFileById(
  req,
  res
) {
  try {
    const file =
      await getFile(
        req.params.fileId,
        req.user
      );

    res.status(200).json({
      data: file,
      message:
        "File retrieved successfully"
    });
  } catch (error) {
    console.error(
      "File retrieval failed:",
      error
    );

    if (
      error.message ===
      "INVALID_FILE_REFERENCE"
    ) {
      return res.status(400).json({
        error: {
          code:
            "INVALID_FILE_REFERENCE",

          message:
            "Invalid file ID"
        }
      });
    }

    if (
      error.message ===
      "FILE_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "FILE_NOT_FOUND",

          message:
            "File not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "FILE_RETRIEVAL_FAILED",

        message:
          "Unable to retrieve file"
      }
    });
  }
}

async function downloadFile(
  req,
  res
) {
  try {
    const result =
      await getFileForDownload(
        req.params.fileId,
        req.user
      );

    return res.download(
      result.storagePath,
      result.file.original_name,
      (error) => {
        if (error) {
          console.error(
            "File download failed:",
            error
          );

          if (
            !res.headersSent
          ) {
            res.status(500).json({
              error: {
                code:
                  "FILE_DOWNLOAD_FAILED",

                message:
                  "Unable to download file"
              }
            });
          }
        }
      }
    );
  } catch (error) {
    console.error(
      "File download failed:",
      error
    );

    if (
      error.message ===
      "INVALID_FILE_REFERENCE"
    ) {
      return res.status(400).json({
        error: {
          code:
            "INVALID_FILE_REFERENCE",

          message:
            "Invalid file ID"
        }
      });
    }

    if (
      error.message ===
        "FILE_NOT_FOUND" ||
      error.message ===
        "FILE_STORAGE_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "FILE_NOT_FOUND",

          message:
            "File not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "FILE_DOWNLOAD_FAILED",

        message:
          "Unable to download file"
      }
    });
  }
}

async function removeFile(
  req,
  res
) {
  try {
    const file =
      await deleteFile(
        req.params.fileId,
        req.user
      );

    res.status(200).json({
      data: file,
      message:
        "File deleted successfully"
    });
  } catch (error) {
    console.error(
      "File deletion failed:",
      error
    );

    if (
      error.message ===
      "INVALID_FILE_REFERENCE"
    ) {
      return res.status(400).json({
        error: {
          code:
            "INVALID_FILE_REFERENCE",

          message:
            "Invalid file ID"
        }
      });
    }

    if (
      error.message ===
      "FILE_NOT_FOUND"
    ) {
      return res.status(404).json({
        error: {
          code:
            "FILE_NOT_FOUND",

          message:
            "File not found"
        }
      });
    }

    if (
      error.message ===
      "FILE_DELETE_FORBIDDEN"
    ) {
      return res.status(403).json({
        error: {
          code:
            "FILE_DELETE_FORBIDDEN",

          message:
            "You do not have permission to delete this file"
        }
      });
    }

    res.status(500).json({
      error: {
        code:
          "FILE_DELETE_FAILED",

        message:
          "Unable to delete file"
      }
    });
  }
}

module.exports = {
  upload,
  getCompanyFiles,
  getFileById,
  downloadFile,
  removeFile
};