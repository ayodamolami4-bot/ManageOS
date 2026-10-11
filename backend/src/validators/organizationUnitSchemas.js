const { z } = require("zod");

const createOrganizationUnitSchema = z.object({
  // Optional for older clients; the authenticated company is authoritative.
  companyId: z.string().uuid().optional(),
  parentUnitId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1, "Unit name is required").max(150),
  type: z.string().trim().min(1, "Unit type is required").max(50),
  description: z.string().trim().max(10000).nullable().optional(),
}).strict();

module.exports = { createOrganizationUnitSchema };
