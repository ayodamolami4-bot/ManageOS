const { z } = require("zod");

const requestEmailChangeSchema = z.object({
  newEmail: z.string().trim().email().max(254).transform(v => v.toLowerCase()),
  currentPassword: z.string().min(1).max(128)
}).strict();

const confirmEmailChangeSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i, "Invalid email confirmation token")
}).strict();

module.exports = { requestEmailChangeSchema, confirmEmailChangeSchema };
