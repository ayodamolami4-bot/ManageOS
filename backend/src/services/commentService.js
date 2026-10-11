const {
  createComment,
  getDiscussionComments,
  getCommentById
} = require("../repositories/commentRepository");

const pool = require("../db/database");
const { canAccessDiscussion } = require("./discussionService");

async function getDiscussionForCompany(
  discussionId,
  user
) {
  const result = await pool.query(
    `
    SELECT
      id,
      company_id,
      resource_type,
      resource_id
    FROM discussions
    WHERE id = $1
      AND company_id = $2
    LIMIT 1
    `,
    [discussionId, user.company_id]
  );

  const discussion = result.rows[0];
  if (!discussion || !(await canAccessDiscussion(discussion, user))) return null;
  return discussion;
}

async function createNewComment({
  discussionId,
  content
}, user) {
  const discussion =
    await getDiscussionForCompany(discussionId, user);

  if (!discussion) {
    throw new Error("DISCUSSION_NOT_FOUND");
  }

  if (!content || !content.trim()) {
    throw new Error("COMMENT_CONTENT_REQUIRED");
  }

  return await createComment({
    discussionId,
    authorId: user.id,
    content: content.trim()
  });
}

async function getComments(
  discussionId,
  user
) {
  const discussion =
    await getDiscussionForCompany(discussionId, user);

  if (!discussion) {
    throw new Error("DISCUSSION_NOT_FOUND");
  }

  return await getDiscussionComments(
    discussionId
  );
}

async function getComment(
  commentId,
  user
) {
  const comment =
    await getCommentById(commentId);

  if (!comment) {
    throw new Error("COMMENT_NOT_FOUND");
  }

  const discussion =
    await getDiscussionForCompany(comment.discussion_id, user);

  if (!discussion) {
    throw new Error("COMMENT_NOT_FOUND");
  }

  return comment;
}

module.exports = {
  createNewComment,
  getComments,
  getComment
};