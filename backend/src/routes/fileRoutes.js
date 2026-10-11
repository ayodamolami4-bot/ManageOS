const express = require("express");

const {
  upload,
  getCompanyFiles,
  getFileById,
  downloadFile,
  removeFile
} = require("../controllers/fileController");

const {
  authenticate
} = require("../middleware/authMiddleware");

const {
  uploadSingleFile
} = require("../middleware/fileUpload");

const router =
  express.Router();

router.post(
  "/files",
  authenticate,
  uploadSingleFile,
  upload
);

router.get(
  "/files",
  authenticate,
  getCompanyFiles
);

router.get(
  "/files/:fileId/download",
  authenticate,
  downloadFile
);

router.get(
  "/files/:fileId",
  authenticate,
  getFileById
);

router.delete(
  "/files/:fileId",
  authenticate,
  removeFile
);

module.exports = router;