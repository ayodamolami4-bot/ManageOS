const {
  createReport,
  getTaskReports,
  getReportById
} = require("../repositories/reportRepository");

const pool = require("../db/database");
const { canViewTask } = require("./authorizationService");

async function getTaskForCompany(taskId, companyId) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id
    FROM tasks
    WHERE id = $1
      AND company_id = $2
    LIMIT 1
    `,
    [taskId, companyId]
  );

  return result.rows[0];
}

async function requireReportAccess(taskId, user) {
  const task = await getTaskForCompany(taskId, user.company_id);
  if (!task) throw new Error("TASK_NOT_FOUND");

  const allowed = await canViewTask(user, taskId);
  if (!allowed) throw new Error("FORBIDDEN");

  return task;
}

async function createTaskReport({
  taskId,
  progressPercentage,
  content
}, user) {
  await requireReportAccess(taskId, user);

  if (
    !Number.isInteger(progressPercentage) ||
    progressPercentage < 0 ||
    progressPercentage > 100
  ) {
    throw new Error("INVALID_PROGRESS_PERCENTAGE");
  }

  return await createReport({
    taskId,
    createdBy: user.id,
    progressPercentage,
    content
  });
}

async function getReportsForTask(taskId, user) {
  await requireReportAccess(taskId, user);

  return await getTaskReports(taskId);
}

async function getReport(reportId, user) {
  const report = await getReportById(reportId);

  if (!report) {
    throw new Error("REPORT_NOT_FOUND");
  }

  const task = await getTaskForCompany(report.task_id, user.company_id);
  if (!task) throw new Error("REPORT_NOT_FOUND");
  if (!(await canViewTask(user, report.task_id))) {
    throw new Error("FORBIDDEN");
  }

  return report;
}

module.exports = {
  createTaskReport,
  getReportsForTask,
  getReport
};