const { z } = require("zod");

const taskIdParamsSchema = z.object({
  taskId: z.string().uuid("Invalid task reference"),
}).strict();

const reportBodySchema = z.object({
  progressPercentage: z.number().int().min(0).max(100),
  content: z.string().trim().min(1, "Progress report is required").max(10000),
}).strict();

module.exports = { taskIdParamsSchema, reportBodySchema };
