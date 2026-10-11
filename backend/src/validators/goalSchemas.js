const { z } = require("zod");

const statuses = ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"];
const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function isCalendarDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const calendarDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
  .refine(isCalendarDate, "Invalid calendar date");

const goalFields = {
  title: z.string().trim().min(1, "Goal title is required").max(255),
  description: z.string().trim().max(10000).nullable(),
  status: z.enum(statuses),
  priority: z.enum(priorities),
  startDate: calendarDate.nullable(),
  dueDate: calendarDate.nullable(),
};

function datesInOrder(value, context) {
  if (value.startDate && value.dueDate && value.dueDate < value.startDate) {
    context.addIssue({
      code: "custom",
      path: ["dueDate"],
      message: "Due date cannot be earlier than start date",
    });
  }
}

const createGoalSchema = z.object({
  ...goalFields,
  description: goalFields.description.optional(),
  status: goalFields.status.optional(),
  priority: goalFields.priority.optional(),
  startDate: goalFields.startDate.optional(),
  dueDate: goalFields.dueDate.optional(),
}).strict().superRefine(datesInOrder);

const updateGoalSchema = z.object(goalFields).strict().superRefine(datesInOrder);

module.exports = { createGoalSchema, updateGoalSchema };
