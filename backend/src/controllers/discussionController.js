const {
  createNewDiscussion,
  getDiscussions,
  getDiscussion,
  getDiscussionsForResource
} = require("../services/discussionService");

async function createDiscussion(req, res) {
  try {
    const discussion = await createNewDiscussion(
      {
        resourceType: req.body.resourceType,
        resourceId: req.body.resourceId,
        title: req.body.title
      },
      req.user
    );

    res.status(201).json({
      data: discussion,
      message: "Discussion created successfully"
    });
  } catch (error) {
    console.error(
      "Discussion creation failed:",
      error
    );

    if (error.message === "FORBIDDEN") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access this discussion"
        }
      });
    }


    if (error.message === "INVALID_RESOURCE_TYPE") {
      return res.status(422).json({
        error: {
          code: "INVALID_RESOURCE_TYPE",
          message:
            "Resource type must be COMPANY, PROJECT, MILESTONE, or TASK"
        }
      });
    }

    if (error.message === "DISCUSSION_TITLE_REQUIRED") {
      return res.status(422).json({
        error: {
          code: "DISCUSSION_TITLE_REQUIRED",
          message: "Discussion title is required"
        }
      });
    }

    if (error.message === "RESOURCE_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Resource not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "DISCUSSION_CREATION_FAILED",
        message: "Unable to create discussion"
      }
    });
  }
}

async function getAllDiscussions(req, res) {
  try {
    const discussions = await getDiscussions(
      req.user
    );

    res.status(200).json({
      data: discussions,
      message: "Discussions retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Discussion retrieval failed:",
      error
    );

    res.status(500).json({
      error: {
        code: "DISCUSSIONS_RETRIEVAL_FAILED",
        message: "Unable to retrieve discussions"
      }
    });
  }
}

async function getDiscussionById(req, res) {
  try {
    const discussion = await getDiscussion(
      req.params.discussionId,
      req.user
    );

    res.status(200).json({
      data: discussion,
      message: "Discussion retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Discussion retrieval failed:",
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
        code: "DISCUSSION_RETRIEVAL_FAILED",
        message: "Unable to retrieve discussion"
      }
    });
  }
}

async function getResourceDiscussions(req, res) {
  try {
    const discussions =
      await getDiscussionsForResource(
        {
          resourceType: req.params.resourceType,
          resourceId: req.params.resourceId
        },
        req.user
      );

    res.status(200).json({
      data: discussions,
      message:
        "Resource discussions retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Resource discussion retrieval failed:",
      error
    );

    if (error.message === "FORBIDDEN") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access this discussion"
        }
      });
    }


    if (error.message === "INVALID_RESOURCE_TYPE") {
      return res.status(422).json({
        error: {
          code: "INVALID_RESOURCE_TYPE",
          message:
            "Resource type must be COMPANY, PROJECT, MILESTONE, or TASK"
        }
      });
    }

    if (error.message === "RESOURCE_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "RESOURCE_NOT_FOUND",
          message: "Resource not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "RESOURCE_DISCUSSIONS_RETRIEVAL_FAILED",
        message:
          "Unable to retrieve resource discussions"
      }
    });
  }
}

module.exports = {
  createDiscussion,
  getAllDiscussions,
  getDiscussionById,
  getResourceDiscussions
};