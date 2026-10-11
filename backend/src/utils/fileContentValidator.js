const fs = require("fs/promises");
const path = require("path");
const Mimetics = require("mimetics");

const mimetics = new Mimetics();

/*
 * These are the file types currently supported
 * by ManageOS.
 */
const allowedTypes = {
  ".pdf": {
    mime: "application/pdf"
  },

  ".jpg": {
    mime: "image/jpeg"
  },

  ".jpeg": {
    mime: "image/jpeg"
  },

  ".png": {
    mime: "image/png"
  },

  ".webp": {
    mime: "image/webp"
  },

  ".gif": {
    mime: "image/gif"
  },

  ".txt": {
    mime: "text/plain"
  },

  ".csv": {
    mime: "text/csv"
  },

  ".doc": {
    mime: "application/msword"
  },

  ".docx": {
    mime:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  },

  ".xls": {
    mime: "application/vnd.ms-excel"
  },

  ".xlsx": {
    mime:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  },

  ".ppt": {
    mime: "application/vnd.ms-powerpoint"
  },

  ".pptx": {
    mime:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  }
};

/*
 * Validate the actual contents of a temporary file.
 *
 * The filename and MIME type supplied by the client
 * are NOT trusted as proof of file type.
 */
async function validateFileContent(
  filePath,
  originalName
) {
  const extension =
    path.extname(
      originalName || ""
    ).toLowerCase();

  const expected =
    allowedTypes[extension];

  if (!expected) {
    throw new Error(
      "UNSUPPORTED_FILE_TYPE"
    );
  }

  /*
   * Read the temporary file for content analysis.
   *
   * Multer already limits uploads to 10 MB,
   * so this remains bounded by that limit.
   */
  const buffer =
    await fs.readFile(filePath);

  const detected =
    await mimetics.parseAsync(
      buffer,
      originalName
    );

  /*
   * A file that cannot be identified
   * is not trusted.
   */
  if (!detected) {
    throw new Error(
      "FILE_CONTENT_MISMATCH"
    );
  }

  const detectedExtension =
    detected.ext
      ? `.${String(
          detected.ext
        ).toLowerCase()}`
      : null;

  const detectedMime =
    detected.mime
      ? String(
          detected.mime
        ).toLowerCase()
      : null;

  /*
   * The detected extension and MIME type
   * must agree with what ManageOS expects.
   */
  if (
    detectedExtension !== extension ||
    detectedMime !==
      expected.mime
  ) {
    throw new Error(
      "FILE_CONTENT_MISMATCH"
    );
  }

  return {
    extension,
    mimeType:
      detectedMime
  };
}

module.exports = {
  validateFileContent
};