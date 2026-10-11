const pool = require("../db/database");

const {
  createActivityWithClient
} = require("./activityRepository");

async function createProject({
  companyId,
  name,
  description,
  status,
  priority,
  startDate,
  dueDate,
  createdBy
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const projectResult = await client.query(
      `
      INSERT INTO projects (
        company_id,
        name,
        description,
        status,
        priority,
        start_date,
        due_date,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        companyId,
        name,
        description,
        status,
        priority,
        startDate,
        dueDate,
        createdBy
      ]
    );

    const project = projectResult.rows[0];

    await createActivityWithClient(
      client,
      {
        companyId,
        actorId: createdBy,
        action: "PROJECT_CREATED",
        resourceType: "PROJECT",
        resourceId: project.id,
        metadata: {
          name: project.name,
          status: project.status,
          priority: project.priority
        }
      }
    );

    await client.query("COMMIT");

    return project;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getProjects(companyId) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      name,
      description,
      status,
      priority,
      start_date,
      due_date,
      created_by,
      created_at,
      updated_at
    FROM projects
    WHERE company_id = $1
    ORDER BY created_at DESC
    `,
    [companyId]
  );

  return result.rows;
}

async function getProjectById(companyId, projectId) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      name,
      description,
      status,
      priority,
      start_date,
      due_date,
      created_by,
      created_at,
      updated_at
    FROM projects
    WHERE id = $1
      AND company_id = $2
    LIMIT 1
    `,
    [projectId, companyId]
  );

  return result.rows[0];
}

async function updateProject({
  companyId,
  projectId,
  name,
  description,
  status,
  priority,
  startDate,
  dueDate,
  updatedBy
}) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingProjectResult = await client.query(
      `
      SELECT
        id,
        status
      FROM projects
      WHERE id = $1
        AND company_id = $2
      FOR UPDATE
      `,
      [projectId, companyId]
    );

    const existingProject = existingProjectResult.rows[0];

    if (!existingProject) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    const previousStatus = existingProject.status;

    const projectResult = await client.query(
      `
      UPDATE projects
      SET
        name = $1,
        description = $2,
        status = $3,
        priority = $4,
        start_date = $5,
        due_date = $6,
        updated_at = NOW()
      WHERE id = $7
        AND company_id = $8
      RETURNING *
      `,
      [
        name,
        description,
        status,
        priority,
        startDate,
        dueDate,
        projectId,
        companyId
      ]
    );

    const project = projectResult.rows[0];

    if (previousStatus !== project.status) {
      await createActivityWithClient(
        client,
        {
          companyId,
          actorId: updatedBy,
          action: "PROJECT_STATUS_CHANGED",
          resourceType: "PROJECT",
          resourceId: projectId,
          metadata: {
            previous_status: previousStatus,
            new_status: project.status
          }
        }
      );
    }

    await client.query("COMMIT");

    return project;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject
};