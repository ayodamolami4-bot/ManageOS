const { getCompanyAuditLogs } = require("../repositories/auditLogRepository");

function parsePage(raw, fallback, max) {
  if (raw === undefined) return fallback;
  if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw)) return null;
  const number = Number(raw);
  if (!Number.isSafeInteger(number) || number > max) return null;
  return number;
}

async function listAuditLogs(req, res) {
  const page = parsePage(req.query.page, 1, 100000);
  const limit = parsePage(req.query.limit, 30, 100);
  if (page === null || limit === null) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Invalid audit pagination" }
    });
  }

  try {
    const result = await getCompanyAuditLogs(req.user.company_id, {
      limit, offset: (page - 1) * limit
    });

    res.set("Cache-Control", "no-store");
    res.json({
      data: {
        items: result.items,
        pagination: {
          page,
          limit,
          total: result.total,
          hasNextPage: page * limit < result.total
        }
      }
    });
  } catch (error) {
    console.error("Audit retrieval failed:", error);
    res.status(500).json({
      error: { code: "AUDIT_RETRIEVAL_FAILED", message: "Unable to retrieve audit history" }
    });
  }
}

module.exports = { listAuditLogs, parsePage };
