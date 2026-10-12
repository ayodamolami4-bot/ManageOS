const { z } = require("zod");

const email = z.string().trim().email("Enter a valid email address")
  .max(254).transform((value) => value.toLowerCase());

const forgotPasswordSchema = z.object({ email }).strict();
const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i, "Invalid reset token"),
  password: z.string().min(12, "Use at least 12 characters").max(128, "Password is too long"),
}).strict();

module.exports = { forgotPasswordSchema, resetPasswordSchema };
