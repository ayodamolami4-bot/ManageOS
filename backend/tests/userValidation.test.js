const test =
  require("node:test");

const assert =
  require("node:assert/strict");

const {
  userIdParamSchema,
  removeRoleParamsSchema,
  updateUserSchema,
  assignUserRoleSchema,
  removeUserRoleQuerySchema
} = require(
  "../src/validators/userSchemas"
);

const validUserId =
  "613ac7e3-4770-44cc-bdd3-0470879607d0";

const validRoleId =
  "e8a0fecd-d568-4faf-a5c7-987a09c7d58f";

test(
  "user ID parameter accepts valid UUID",
  () => {
    const result =
      userIdParamSchema.safeParse({
        userId: validUserId
      });

    assert.equal(
      result.success,
      true
    );
  }
);

test(
  "user ID parameter rejects invalid UUID",
  () => {
    const result =
      userIdParamSchema.safeParse({
        userId: "invalid-id"
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "user update accepts valid profile data",
  () => {
    const result =
      updateUserSchema.safeParse({
        firstName: "Jane",
        lastName: "Doe",
        email: "JANE@EXAMPLE.COM",
        phone: null,
        country: "Nigeria",
        timezone: "Africa/Lagos",
        jobTitle: "Employee",
        avatarUrl: null
      });

    assert.equal(
      result.success,
      true
    );

    assert.equal(
      result.data.email,
      "jane@example.com"
    );
  }
);

test(
  "user update rejects unknown fields",
  () => {
    const result =
      updateUserSchema.safeParse({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        phone: null,
        country: null,
        timezone: null,
        jobTitle: null,
        avatarUrl: null,
        role: "OWNER"
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "role assignment accepts valid data",
  () => {
    const result =
      assignUserRoleSchema.safeParse({
        roleId: validRoleId,
        organizationUnitId:
          null
      });

    assert.equal(
      result.success,
      true
    );
  }
);

test(
  "role assignment rejects invalid role UUID",
  () => {
    const result =
      assignUserRoleSchema.safeParse({
        roleId: "not-a-uuid"
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "role removal accepts a valid organization unit ID",
  () => {
    const result =
      removeUserRoleQuerySchema.safeParse({
        organizationUnitId:
          validUserId
      });

    assert.equal(
      result.success,
      true
    );
  }
);

test(
  "role removal rejects unknown query fields",
  () => {
    const result =
      removeUserRoleQuerySchema.safeParse({
        organizationUnitId:
          validUserId,
        role: "OWNER"
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "role removal parameters require valid UUIDs",
  () => {
    const result =
      removeRoleParamsSchema.safeParse({
        userId: validUserId,
        roleId: "invalid-role-id"
      });

    assert.equal(
      result.success,
      false
    );
  }
);