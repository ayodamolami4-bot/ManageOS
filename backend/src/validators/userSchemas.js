const {
  z
} = require("zod");

const uuidSchema =
  z.string().uuid(
    "Invalid UUID"
  );

const userIdParamSchema =
  z.object({
    userId:
      uuidSchema
  }).strict();

const roleAssignmentParamsSchema =
  z.object({
    userId:
      uuidSchema
  }).strict();

const removeRoleParamsSchema =
  z.object({
    userId:
      uuidSchema,

    roleId:
      uuidSchema
  }).strict();

const updateUserSchema =
  z.object({
    firstName:
      z.string()
        .trim()
        .min(
          1,
          "First name is required"
        )
        .max(
          100,
          "First name is too long"
        ),

    lastName:
      z.string()
        .trim()
        .min(
          1,
          "Last name is required"
        )
        .max(
          100,
          "Last name is too long"
        ),

    email:
      z.string()
        .trim()
        .email(
          "Invalid email address"
        )
        .max(
          255,
          "Email address is too long"
        )
        .transform(
          (value) =>
            value.toLowerCase()
        ),

    phone:
      z.string()
        .trim()
        .max(
          30,
          "Phone number is too long"
        )
        .nullable(),

    country:
      z.string()
        .trim()
        .max(
          100,
          "Country is too long"
        )
        .nullable(),

    timezone:
      z.string()
        .trim()
        .max(
          100,
          "Timezone is too long"
        )
        .nullable(),

    jobTitle:
      z.string()
        .trim()
        .max(
          150,
          "Job title is too long"
        )
        .nullable(),

    avatarUrl:
      z.string()
        .trim()
        .max(
          2048,
          "Avatar URL is too long"
        )
        .nullable()
  }).strict();

const assignUserRoleSchema =
  z.object({
    roleId:
      uuidSchema,

    organizationUnitId:
      uuidSchema
        .nullable()
        .optional()
  }).strict();

const removeUserRoleQuerySchema =
  z.object({
    organizationUnitId:
      uuidSchema.optional()
  }).strict();

module.exports = {
  userIdParamSchema,
  roleAssignmentParamsSchema,
  removeRoleParamsSchema,
  updateUserSchema,
  assignUserRoleSchema,
  removeUserRoleQuerySchema
};