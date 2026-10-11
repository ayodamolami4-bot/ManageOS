const {
  createReport,
  getTaskReports,
  getReportById
} = require("../repositories/reportRepository");

const pool = require("../db/database");

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

async function createTaskReport({
  taskId,
  progressPercentage,
  content
}, user) {
  const task = await getTaskForCompany(
    taskId,
    user.company_id
  );

  if (!task) {
    throw new Error("TASK_NOT_FOUND");
  }

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
  const task = await getTaskForCompany(
    taskId,
    user.company_id
  );

  if (!task) {
    throw new Error("TASK_NOT_FOUND");
  }

  return await getTaskReports(taskId);
}

async function getReport(reportId, user) {
  const report = await getReportById(reportId);

  if (!report) {
    throw new Error("REPORT_NOT_FOUND");
  }

  const task = await getTaskForCompany(
    report.task_id,
    user.company_id
  );

  if (!task) {
    throw new Error("REPORT_NOT_FOUND");
  }

  return report;
}

module.exports = {
  createTaskReport,
  getReportsForTask,
  getReport
};