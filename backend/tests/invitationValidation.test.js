const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createInvitationSchema,
  acceptInvitationSchema
} = require("../src/validators/invitationSchemas");

test(
  "invitation creation accepts valid data",
  () => {
    const result =
      createInvitationSchema.safeParse({
        email: "employee@example.com",
        roleId:
          "613ac7e3-4770-44cc-bdd3-0470879607d0",
        organizationUnitId:
          "e8a0fecd-d568-4faf-a5c7-987a09c7d58f"
      });

    assert.equal(
      result.success,
      true
    );
  }
);

test(
  "invitation creation normalizes email",
  () => {
    const result =
      createInvitationSchema.safeParse({
        email: "  EMPLOYEE@EXAMPLE.COM  ",
        roleId:
          "613ac7e3-4770-44cc-bdd3-0470879607d0"
      });

    assert.equal(
      result.success,
      true
    );

    assert.equal(
      result.data.email,
      "employee@example.com"
    );
  }
);

test(
  "invitation creation rejects invalid email",
  () => {
    const result =
      createInvitationSchema.safeParse({
        email: "not-an-email",
        roleId:
          "613ac7e3-4770-44cc-bdd3-0470879607d0"
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "invitation creation rejects invalid UUID",
  () => {
    const result =
      createInvitationSchema.safeParse({
        email: "employee@example.com",
        roleId: "not-a-uuid"
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "invitation creation rejects unknown fields",
  () => {
    const result =
      createInvitationSchema.safeParse({
        email: "employee@example.com",
        roleId:
          "613ac7e3-4770-44cc-bdd3-0470879607d0",
        isOwner: true
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "invitation acceptance accepts a valid token",
  () => {
    const result =
      acceptInvitationSchema.safeParse({
        token:
          "a".repeat(64),

        firstName: "Jane",
        lastName: "Doe",
        password:
          "ManageOSDev2026!"
      });

    assert.equal(
      result.success,
      true
    );
  }
);

test(
  "invitation acceptance rejects malformed token",
  () => {
    const result =
      acceptInvitationSchema.safeParse({
        token: "short-token",

        firstName: "Jane",
        lastName: "Doe",
        password:
          "ManageOSDev2026!"
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "invitation acceptance rejects short password",
  () => {
    const result =
      acceptInvitationSchema.safeParse({
        token:
          "a".repeat(64),

        firstName: "Jane",
        lastName: "Doe",
        password: "short"
      });

    assert.equal(
      result.success,
      false
    );
  }
);

test(
  "invitation acceptance rejects unknown fields",
  () => {
    const result =
      acceptInvitationSchema.safeParse({
        token:
          "a".repeat(64),

        firstName: "Jane",
        lastName: "Doe",
        password:
          "ManageOSDev2026!",

        roleId:
          "613ac7e3-4770-44cc-bdd3-0470879607d0"
      });

    assert.equal(
      result.success,
      false
    );
  }
);