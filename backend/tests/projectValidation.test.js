const test =
  require("node:test");

const assert =
  require("node:assert/strict");

const {
  createProjectSchema,
  updateProjectSchema
} = require(
  "../src/validators/projectSchemas"
);

test(
  "project creation accepts valid data",
  () => {
    const result =
      createProjectSchema.safeParse({
        name:
          "ManageOS Test Project",

        description:
          "Testing project validation",

        status:
          "ACTIVE",

        priority:
          "HIGH",

        startDate:
          "2026-09-20",

        dueDate:
          "2026-10-20"
      });

    assert.equal(
      result.success,
      true
    );
  }
);

test(
  "project creation rejects invalid status",
  () => {
    const result =
      createProjectSchema.safeParse({
        name:
          "Invalid Project",

        status:
          "NOT_A_STATUS",

        priority:
          "HIGH"
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "project creation rejects invalid priority",
  () => {
    const result =
      createProjectSchema.safeParse({
        name:
          "Invalid Project",

        status:
          "ACTIVE",

        priority:
          "SUPER_HIGH"
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "project creation rejects due date before start date",
  () => {
    const result =
      createProjectSchema.safeParse({
        name:
          "Date Validation Test",

        startDate:
          "2026-10-20",

        dueDate:
          "2026-09-20"
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "project update rejects unknown fields",
  () => {
    const result =
      updateProjectSchema.safeParse({
        name:
          "Updated Project",

        description:
          "Updated description",

        status:
          "ACTIVE",

        priority:
          "MEDIUM",

        startDate:
          null,

        dueDate:
          null,

        isOwner:
          true
      });

    assert.equal(
      result.success,
      false
    );
  }
);