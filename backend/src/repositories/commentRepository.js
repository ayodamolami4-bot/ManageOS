const pool = require("../db/database");

async function createComment({
  discussionId,
  authorId,
  content
}) {
  const result = await pool.query(
    `
    INSERT INTO comments (
      discussion_id,
      author_id,
      content
    )
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [
      discussionId,
      authorId,
      content
    ]
  );

  return result.rows[0];
}

async function getDiscussionComments(
  discussionId
) {
  const result = await pool.query(
    `
    SELECT
      id,
      discussion_id,
      author_id,
      content,
      created_at,
      updated_at
    FROM comments
    WHERE discussion_id = $1
    ORDER BY created_at ASC
    `,
    [discussionId]
  );

  return result.rows;
}

async function getCommentById(commentId) {
  const result = await pool.query(
    `
    SELECT
      id,
      discussion_id,
      author_id,
      content,
      created_at,
      updated_at
    FROM comments
    WHERE id = $1
    LIMIT 1
    `,
    [commentId]
  );

  return result.rows[0];
}

module.exports = {
  createComment,
  getDiscussionComments,
  getCommentById
};