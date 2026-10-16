const express = require("express");
const rateLimit = require("express-rate-limit");
const demo = require("../services/publicDemoService");

const router = express.Router();
router.use(rateLimit({
  windowMs: 60 * 1000,
  limit: 90,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { code: "DEMO_RATE_LIMITED", message: "Please try again shortly." } }
}));
router.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.set("X-Content-Type-Options", "nosniff");
  next();
});

function handleError(error, res) {
  if (error.status === 404) return res.status(404).json({
    error: { code: "DEMO_NOT_FOUND", message: "The sample workspace is unavailable." }
  });
  console.error("Public demo request failed:", error.message);
  return res.status(503).json({
    error: { code: "DEMO_UNAVAILABLE", message: "The sample workspace is temporarily unavailable." }
  });
}

router.get("/overview", async (_req, res) => {
  try { res.json({ data: await demo.overview() }); }
  catch (error) { handleError(error, res); }
});

router.get("/files/:fileId", async (req, res) => {
  try {
    const file = await demo.document(req.params.fileId);
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.set("Content-Disposition", 'attachment; filename="' + file.filename + '"');
    return res.send(file.bytes);
  } catch (error) { return handleError(error, res); }
});

router.all(["/overview", "/files/:fileId"], (_req, res) => {
  res.status(405).json({ error: { code: "DEMO_READ_ONLY", message: "The public demo is view only." } });
});
module.exports = router;
