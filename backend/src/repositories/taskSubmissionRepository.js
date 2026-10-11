const pool = require("../db/database");

const {
  createNotificationWithClient
} = require("./notificationRepository");

const {
  createActivityWithClient
} = require("./activityRepository");

async function createTaskSubmission({
  taskId,
  submittedBy,
  description
}) {
  const result = await pool.query(
    `
    INSERT INTO task_submissions (
      task_id,
      submitted_by,
      description
    )
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [taskId, submittedBy, description]
  );

  return result.rows[0];
}

async function getTaskSubmissions(taskId) {
  const result = await pool.query(
    `
    SELECT
      id,
      task_id,
      submitted_by,
      description,
      submitted_at,
      created_at
    FROM task_submissions
    WHERE task_id = $1
    ORDER BY submitted_at DESC
    `,
    [taskId]
  );

  return result.rows;
}

async function getTaskSubmissionById(submissionId) {
  const result = await pool.query(
    `
    SELECT
      id,
      task_id,
      submitted_by,
      description,
      submitted_at,
      created_at
    FROM task_submissions
    WHERE id = $1
    LIMIT 1
    `,
    [submissionId]
  );

  return result.rows[0];
}

async function createSubmissionAndChangeStatus({
  taskId,
  companyId,
  submittedBy,
  description
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const taskResult = await client.query(
      `
      SELECT
        id,
        project_id,
        status
      FROM tasks
      WHERE id = $1
        AND company_id = $2
      FOR UPDATE
      `,
      [
        taskId,
        companyId
      ]
    );

    const task = taskResult.rows[0];

    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    if (task.status !== "IN_PROGRESS") {
      throw new Error("TASK_NOT_READY_FOR_SUBMISSION");
    }

    const submissionResult = await client.query(
      `
      INSERT INTO task_submissions (
        task_id,
        submitted_by,
        description
      )
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [
        taskId,
        submittedBy,
        description
      ]
    );

    const updatedTaskResult = await client.query(
      `
      UPDATE tasks
      SET
        status = 'SUBMITTED',
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [taskId]
    );

    const historyResult = await client.query(
      `
      INSERT INTO task_status_history (
        task_id,
        previous_status,
        new_status,
        changed_by
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        taskId,
        task.status,
        "SUBMITTED",
        submittedBy
      ]
    );

    const projectLeadsResult = await client.query(
      `
      SELECT
        pl.user_id
      FROM project_leads pl
      JOIN projects p
        ON p.id = pl.project_id
      JOIN users u
        ON u.id = pl.user_id
      WHERE pl.project_id = $1
        AND p.company_id = $2
        AND u.company_id = $2
      `,
      [
        task.project_id,
        companyId
      ]
    );

    for (const lead of projectLeadsResult.rows) {
      await createNotificationWithClient(
        client,
        {
          recipientId: lead.user_id,
          type: "TASK_SUBMITTED",
          title: "Task submitted for review",
          message:
            "A task has been submitted and is ready for your review.",
          resourceType: "TASK",
          resourceId: taskId
        }
      );
    }
      await createActivityWithClient(
  client,
  {
    companyId,
    actorId: submittedBy,
    action: "TASK_SUBMITTED",
    resourceType: "TASK",
    resourceId: taskId,
    metadata: {
      submitted_by: submittedBy
    }
  }
);
    

    await client.query("COMMIT");

    return {
      submission: submissionResult.rows[0],
      task: updatedTaskResult.rows[0],
      history: historyResult.rows[0]
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createTaskSubmission,
  getTaskSubmissions,
  getTaskSubmissionById,
  createSubmissionAndChangeStatus
};