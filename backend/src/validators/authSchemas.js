const { z } = require("zod");

const registerCompanySchema = z
  .object({
    companyName: z
      .string()
      .trim()
      .min(1, "Company name is required")
      .max(200, "Company name is too long"),

    firstName: z
      .string()
      .trim()
      .min(1, "First name is required")
      .max(100, "First name is too long"),

    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required")
      .max(100, "Last name is too long"),

    email: z
      .string()
      .trim()
      .email("Invalid email address")
      .max(254, "Email address is too long")
      .transform((value) =>
        value.toLowerCase()
      ),

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

const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("Invalid email address")
      .max(254, "Email address is too long")
      .transform((value) =>
        value.toLowerCase()
      ),

    password: z
      .string()
      .min(
        1,
        "Password is required"
      )
      .max(
        128,
        "Password is too long"
      )
  })
  .strict();

module.exports = {
  registerCompanySchema,
  loginSchema
};