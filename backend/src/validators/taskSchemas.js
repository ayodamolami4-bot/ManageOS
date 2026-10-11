const { z } = require("zod");

const TASK_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT"
];

const TASK_STATUSES = [
  "ASSIGNED",
  "IN_PROGRESS",
  "SUBMITTED",
  "TEAM_LEAD_REVIEW",
  "APPROVED",
  "NEEDS_CHANGES",
  "COMPLETED"
];

const uuidSchema = z
  .string()
  .uuid("Invalid UUID");

const dateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must use YYYY-MM-DD format"
  )
  .refine(
    (value) => {
      const [year, month, day] =
        value.split("-").map(Number);

      const date = new Date(
        Date.UTC(
          year,
          month - 1,
          day
        )
      );

      return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
      );
    },
    "Invalid calendar date"
  );

/*
 * Task creation.
 *
 * A new task always starts as ASSIGNED.
 * Status is therefore not accepted from
 * the client during creation.
 */
const createTaskSchema = z
  .object({
    projectId: uuidSchema,

    milestoneId: uuidSchema
      .nullable()
      .optional(),

    title: z
      .string()
      .trim()
      .min(
        1,
        "Task title is required"
      )
      .max(
        255,
        "Task title is too long"
      ),

    description: z
      .string()
      .trim()
      .max(
        10000,
        "Task description is too long"
      )
      .nullable()
      .optional(),

    priority: z
      .enum(TASK_PRIORITIES)
      .optional()
      .default("MEDIUM"),

    dueDate: dateSchema
      .nullable()
      .optional()
  })
  .strict();

/*
 * Task detail update.
 *
 * Status is deliberately excluded.
 * Status changes must go through the
 * dedicated workflow endpoint.
 */
const updateTaskSchema = z
  .object({
    milestoneId: uuidSchema
      .nullable(),

    title: z
      .string()
      .trim()
      .min(
        1,
        "Task title is required"
      )
      .max(
        255,
        "Task title is too long"
      ),

    description: z
      .string()
      .trim()
      .max(
        10000,
        "Task description is too long"
      )
      .nullable(),

    priority: z
      .enum(TASK_PRIORITIES),

    dueDate: dateSchema
      .nullable()
  })
  .strict();

/*
 * Dedicated workflow status change.
 */
const changeTaskStatusSchema = z
  .object({
    newStatus: z
      .enum(["IN_PROGRESS"])
  })
  .strict();

module.exports = {
  TASK_PRIORITIES,
  TASK_STATUSES,
  createTaskSchema,
  updateTaskSchema,
  changeTaskStatusSchema
};