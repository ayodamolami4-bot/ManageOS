const { z } = require("zod");

const id = z.string().uuid("Invalid resource reference");
const discussionIdParams = z.object({ discussionId: id }).strict();
const discussionCreateBody = z.object({
  resourceType: z.enum(["COMPANY", "PROJECT", "MILESTONE", "TASK"]),
  resourceId: id,
  title: z.string().trim().min(1, "Discussion title is required").max(255),
}).strict();
const commentCreateBody = z.object({
  content: z.string().trim().min(1, "Comment is required").max(10000),
}).strict();

module.exports = {
  discussionIdParams,
  discussionCreateBody,
  commentCreateBody,
};
