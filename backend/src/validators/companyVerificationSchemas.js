const { z } = require("zod");

const verifyCompanyRegistrationSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i, "Invalid verification link")
}).strict();

module.exports = { verifyCompanyRegistrationSchema };
