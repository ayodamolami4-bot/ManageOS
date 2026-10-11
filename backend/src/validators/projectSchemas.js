const { z } = require("zod");

const PROJECT_STATUSES = [
  "PLANNED",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED"
];

const PROJECT_PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT"
];

function isValidCalendarDate(value) {
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
}

const dateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must use YYYY-MM-DD format"
  )
  .refine(
    isValidCalendarDate,
    "Invalid calendar date"
  );

/*
 * Project creation.
 *
 * status and priority are optional because
 * projectService provides database-aligned
 * application defaults:
 *
 * status   -> PLANNED
 * priority -> MEDIUM
 */
const createProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(
        1,
        "Project name is required"
      )
      .max(
        255,
        "Project name is too long"
      ),

    description: z
      .string()
      .trim()
      .max(
        10000,
        "Project description is too long"
      )
      .nullable()
      .optional(),

    status: z
      .enum(PROJECT_STATUSES)
      .optional(),

    priority: z
      .enum(PROJECT_PRIORITIES)
      .optional(),

    startDate: dateSchema
      .nullable()
      .optional(),

    dueDate: dateSchema
      .nullable()
      .optional()
  })
  .strict()
  .superRefine(
    (data, context) => {
      if (
        data.startDate &&
        data.dueDate
      ) {
        if (
          data.dueDate <
          data.startDate
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,
            path: ["dueDate"],
            message:
              "Due date cannot be earlier than start date"
          });
        }
      }
    }
  );

/*
 * Project update.
 *
 * This endpoint currently uses PUT and the
 * repository replaces every editable project
 * field. Therefore the editable fields are
 * deliberately required here.
 *
 * Nullable fields may be explicitly cleared
 * with null.
 */
const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(
        1,
        "Project name is required"
      )
      .max(
        255,
        "Project name is too long"
      ),

    description: z
      .string()
      .trim()
      .max(
        10000,
        "Project description is too long"
      )
      .nullable(),

    status: z
      .enum(PROJECT_STATUSES),

    priority: z
      .enum(PROJECT_PRIORITIES),

    startDate: dateSchema
      .nullable(),

    dueDate: dateSchema
      .nullable()
  })
  .strict()
  .superRefine(
    (data, context) => {
      if (
        data.startDate &&
        data.dueDate
      ) {
        if (
          data.dueDate <
          data.startDate
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,
            path: ["dueDate"],
            message:
              "Due date cannot be earlier than start date"
          });
        }
      }
    }
  );

module.exports = {
  createProjectSchema,
  updateProjectSchema
};