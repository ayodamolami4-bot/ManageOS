const test =
  require("node:test");

const assert =
  require("node:assert/strict");

const {
  TASK_WORKFLOW
} = require(
  "../src/services/taskWorkflowService"
);

const {
  createTaskSchema,
  updateTaskSchema,
  changeTaskStatusSchema
} = require(
  "../src/validators/taskSchemas"
);

test(
  "new task schema does not accept a client supplied status",
  () => {
    const result =
      createTaskSchema.safeParse({
        projectId:
          "e8a0fecd-d568-4faf-a5c7-987a09c7d58f",

        milestoneId:
          null,

        title:
          "Workflow Test",

        description:
          "Testing task creation",

        status:
          "COMPLETED",

        priority:
          "MEDIUM",

        dueDate:
          null
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "new task defaults priority to MEDIUM",
  () => {
    const result =
      createTaskSchema.safeParse({
        projectId:
          "e8a0fecd-d568-4faf-a5c7-987a09c7d58f",

        milestoneId:
          null,

        title:
          "Default Priority Test",

        description:
          null,

        dueDate:
          null
      });

    assert.equal(
      result.success,
      true
    );

    assert.equal(
      result.data.priority,
      "MEDIUM"
    );
  }
);

test(
  "task update schema does not accept status",
  () => {
    const result =
      updateTaskSchema.safeParse({
        milestoneId:
          null,

        title:
          "Updated Task",

        description:
          null,

        status:
          "COMPLETED",

        priority:
          "HIGH",

        dueDate:
          null
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "valid status change is accepted",
  () => {
    const result =
      changeTaskStatusSchema.safeParse({
        newStatus:
          "IN_PROGRESS"
      });

    assert.equal(
      result.success,
      true
    );
  }
);

test(
  "invalid status value is rejected",
  () => {
    const result =
      changeTaskStatusSchema.safeParse({
        newStatus:
          "INVALID_STATUS"
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "ASSIGNED can move to IN_PROGRESS",
  () => {
    assert.equal(
      TASK_WORKFLOW.ASSIGNED.includes(
        "IN_PROGRESS"
      ),
      true
    );
  }
);

test(
  "IN_PROGRESS cannot directly move to COMPLETED",
  () => {
    assert.equal(
      TASK_WORKFLOW.IN_PROGRESS.includes(
        "COMPLETED"
      ),
      false
    );
  }
);

test(
  "APPROVED can move to COMPLETED",
  () => {
    assert.equal(
      TASK_WORKFLOW.APPROVED.includes(
        "COMPLETED"
      ),
      true
    );
  }
);