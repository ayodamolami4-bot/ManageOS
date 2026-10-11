const { z } = require("zod");

const uuid = z.string().uuid("Invalid resource reference");
const taskParams = z.object({ taskId: uuid }).strict();
const blockerParams = z.object({ blockerId: uuid }).strict();
const requestParams = z.object({ requestId: uuid }).strict();

const description = z.string().trim().max(10000).nullable().optional();
const title = z.string().trim().min(1, "A title is required").max(255);
const blockerBody = z.object({ title, description }).strict();

const requestBody = z.object({
  assignedTo: uuid.nullable().optional(),
  type: z.enum(["APPROVAL", "ACCESS", "DECISION", "HELP", "OTHER"]),
  title,
  description,
}).strict();

const requestStatusBody = z.object({
  status: z.enum(["IN_PROGRESS", "RESOLVED", "REJECTED"]),
}).strict();

module.exports = {
  taskParams, blockerParams, requestParams,
  blockerBody, requestBody, requestStatusBody,
};
