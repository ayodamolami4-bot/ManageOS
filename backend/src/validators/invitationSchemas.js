const { z } = require("zod");

const personNamePattern = /^[\p{L}\p{M}][\p{L}\p{M}\s'’.-]*$/u;


const uuidSchema = z
  .string()
  .uuid("Invalid UUID");

const invitationTokenSchema = z
  .string()
  .regex(
    /^[a-f0-9]{64}$/i,
    "Invalid invitation token"
  );

const createInvitationSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Invalid email address")
      .max(
        254,
        "Email address is too long"
      )
      .transform((value) =>
        value.toLowerCase()
      ),

    roleId: uuidSchema,

    organizationUnitId:
      uuidSchema
        .nullable()
        .optional()
  })
  .strict();

const acceptInvitationSchema = z
  .object({
    token:
      invitationTokenSchema,

    firstName: z
      .string()
      .trim()
      .min(
        1,
        "First name is required"
      )
      .max(
        100,
        "First name is too long"
      )
      .regex(personNamePattern, "First name must contain letters rather than numbers or symbols"),

    lastName: z
      .string()
      .trim()
      .min(
        1,
        "Last name is required"
      )
      .max(
        100,
        "Last name is too long"
      )
      .regex(personNamePattern, "Last name must contain letters rather than numbers or symbols"),

    password: z
      .string()
      .min(
        12,
        "Password must be at least 12 characters"
      )
      .max(
        128,
        "Password is too long"
      )
  })
  .strict();

module.exports = {
  createInvitationSchema,
  acceptInvitationSchema
};