const { z } = require("zod");

function validDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const dateField = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
  .refine(validDate, "Invalid calendar date");

const name = z.string().trim().min(1, "Milestone name is required").max(255);
const description = z.string().trim().max(10000).nullable();
const status = z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]);

const createMilestoneSchema = z.object({
  name,
  description: description.optional(),
  status: status.optional(),
  dueDate: dateField.nullable().optional()
}).strict();

const updateMilestoneSchema = z.object({
  name,
  description,
  status,
  dueDate: dateField.nullable()
}).strict();

const projectMilestoneParamsSchema = z.object({
  projectId: z.string().uuid(),
  milestoneId: z.string().uuid().optional()
}).strict();

module.exports = {
  createMilestoneSchema,
  updateMilestoneSchema,
  projectMilestoneParamsSchema
};
