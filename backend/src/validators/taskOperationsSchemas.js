const { z } = require("zod");

const uuid = z.string().uuid("Invalid UUID reference");
const taskParams = z.object({ taskId: uuid }).strict();
const assignmentParams = z.object({ assignmentId: uuid }).strict();
const submissionParams = z.object({ submissionId: uuid }).strict();
const assignmentBody = z.object({
  userId: uuid,
  estimatedEffortHours: z.number().finite().min(0).max(9999.99)
    .refine((value) => Math.abs(Math.round(value * 100) - value * 100) < 0.000001,
      "Use no more than two decimal places")
    .nullable().optional(),
}).strict();

const submissionBody = z.object({
  description: z.string().trim().min(1, "Describe the completed work").max(10000),
}).strict();

const reviewBody = z.object({
  decision: z.enum(["APPROVED", "NEEDS_CHANGES"]),
  comment: z.string().trim().max(10000).nullable().optional(),
}).strict().superRefine((value, context) => {
  if (value.decision === "NEEDS_CHANGES" && !value.comment?.trim()) {
    context.addIssue({
      code: "custom",
      path: ["comment"],
      message: "Explain what needs to change",
    });
  }
});

module.exports = { taskParams, assignmentParams, submissionParams, assignmentBody, submissionBody, reviewBody };
