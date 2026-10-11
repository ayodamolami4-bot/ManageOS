const {
  createNewComment,
  getComments,
  getComment
} = require("../services/commentService");

async function createComment(req, res) {
  try {
    const comment = await createNewComment(
      {
        discussionId: req.params.discussionId,
        content: req.body.content
      },
      req.user
    );

    res.status(201).json({
      data: comment,
      message: "Comment created successfully"
    });
  } catch (error) {
    console.error(
      "Comment creation failed:",
      error
    );

    if (error.message === "DISCUSSION_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "DISCUSSION_NOT_FOUND",
          message: "Discussion not found"
        }
      });
    }

    if (error.message === "COMMENT_CONTENT_REQUIRED") {
      return res.status(422).json({
        error: {
          code: "COMMENT_CONTENT_REQUIRED",
          message: "Comment content is required"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "COMMENT_CREATION_FAILED",
        message: "Unable to create comment"
      }
    });
  }
}

async function getDiscussionComments(req, res) {
  try {
    const comments = await getComments(
      req.params.discussionId,
      req.user
    );

    res.status(200).json({
      data: comments,
      message: "Comments retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Comment retrieval failed:",
      error
    );

    if (error.message === "DISCUSSION_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "DISCUSSION_NOT_FOUND",
          message: "Discussion not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "COMMENTS_RETRIEVAL_FAILED",
        message: "Unable to retrieve comments"
      }
    });
  }
}

async function getCommentById(req, res) {
  try {
    const comment = await getComment(
      req.params.commentId,
      req.user
    );

    res.status(200).json({
      data: comment,
      message: "Comment retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Comment retrieval failed:",
      error
    );

    if (error.message === "COMMENT_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "COMMENT_NOT_FOUND",
          message: "Comment not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "COMMENT_RETRIEVAL_FAILED",
        message: "Unable to retrieve comment"
      }
    });
  }
}

module.exports = {
  createComment,
  getDiscussionComments,
  getCommentById
};