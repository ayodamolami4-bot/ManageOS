const path = require("path");
const multer = require("multer");

const {
  TEMP_ROOT
} = require("../utils/fileStorage");

const allowedMimeTypes = {
  "application/pdf": [".pdf"],

  "image/jpeg": [
    ".jpg",
    ".jpeg"
  ],

  "image/png": [".png"],

  "image/webp": [".webp"],

  "image/gif": [".gif"],

  "text/plain": [".txt"],

  "text/csv": [".csv"],

  "application/msword": [".doc"],

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    [".docx"],

  "application/vnd.ms-excel": [".xls"],

  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    [".xlsx"],

  "application/vnd.ms-powerpoint": [".ppt"],

  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    [".pptx"]
};

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, TEMP_ROOT);
  },

  filename(req, file, callback) {
    const extension =
      path.extname(
        file.originalname || ""
      ).toLowerCase();

    callback(
      null,
      `${require("crypto").randomUUID()}${extension}`
    );
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter(
    req,
    file,
    callback
  ) {
    const extension =
      path.extname(
        file.originalname || ""
      ).toLowerCase();

    const allowedExtensions =
      allowedMimeTypes[
        file.mimetype
      ];

    if (
      !allowedExtensions ||
      !allowedExtensions.includes(
        extension
      )
    ) {
      return callback(
        new Error(
          "UNSUPPORTED_FILE_TYPE"
        )
      );
    }

    callback(null, true);
  }
});

function uploadSingleFile(
  req,
  res,
  next
) {
  upload.single("file")(
    req,
    res,
    (error) => {
      if (!error) {
        return next();
      }

      if (
        error instanceof multer.MulterError
      ) {
        if (
          error.code ===
          "LIMIT_FILE_SIZE"
        ) {
          return res.status(413).json({
            error: {
              code: "FILE_TOO_LARGE",
              message:
                "File size must not exceed 10 MB"
            }
          });
        }

        return res.status(400).json({
          error: {
            code:
              "FILE_UPLOAD_FAILED",
            message:
              "Unable to process uploaded file"
          }
        });
      }

      if (
        error.message ===
        "UNSUPPORTED_FILE_TYPE"
      ) {
        return res.status(400).json({
          error: {
            code:
              "UNSUPPORTED_FILE_TYPE",
            message:
              "This file type is not supported"
          }
        });
      }

      console.error(
        "File upload middleware failed:",
        error
      );

      return res.status(400).json({
        error: {
          code:
            "FILE_UPLOAD_FAILED",
          message:
            "Unable to process uploaded file"
        }
      });
    }
  );
}

module.exports = {
  uploadSingleFile
};