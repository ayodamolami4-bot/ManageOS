const {
  createNewRequest,
  getRequests,
  getRequest,
  changeRequestStatus
} = require("../services/requestService");

async function createRequest(req, res) {
  try {
    const request = await createNewRequest(
      {
        assignedTo: req.body.assignedTo,
        type: req.body.type,
        title: req.body.title,
        description: req.body.description
      },
      req.user
    );

    res.status(201).json({
      data: request,
      message: "Request created successfully"
    });
  } catch (error) {
    console.error("Request creation failed:", error);

    if (error.message === "INVALID_REQUEST_TYPE") {
      return res.status(422).json({
        error: {
          code: "INVALID_REQUEST_TYPE",
          message:
            "Request type must be APPROVAL, ACCESS, DECISION, HELP, or OTHER"
        }
      });
    }

    if (error.message === "REQUEST_TITLE_REQUIRED") {
      return res.status(422).json({
        error: {
          code: "REQUEST_TITLE_REQUIRED",
          message: "Request title is required"
        }
      });
    }

    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "Assigned user not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "REQUEST_CREATION_FAILED",
        message: "Unable to create request"
      }
    });
  }
}

async function getAllRequests(req, res) {
  try {
    const requests = await getRequests(req.user);

    res.status(200).json({
      data: requests,
      message: "Requests retrieved successfully"
    });
  } catch (error) {
    console.error("Request retrieval failed:", error);

    res.status(500).json({
      error: {
        code: "REQUESTS_RETRIEVAL_FAILED",
        message: "Unable to retrieve requests"
      }
    });
  }
}

async function getRequestById(req, res) {
  try {
    const request = await getRequest(
      req.params.requestId,
      req.user
    );

    res.status(200).json({
      data: request,
      message: "Request retrieved successfully"
    });
  } catch (error) {
    console.error("Request retrieval failed:", error);

    if (error.message === "REQUEST_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "REQUEST_NOT_FOUND",
          message: "Request not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "REQUEST_RETRIEVAL_FAILED",
        message: "Unable to retrieve request"
      }
    });
  }
}

async function updateRequestStatus(req, res) {
  try {
    const request = await changeRequestStatus(
      req.params.requestId,
      req.body.status,
      req.user
    );

    res.status(200).json({
      data: request,
      message: "Request status updated successfully"
    });
  } catch (error) {
    console.error(
      "Request status update failed:",
      error
    );

    if (error.message === "REQUEST_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "REQUEST_NOT_FOUND",
          message: "Request not found"
        }
      });
    }

    if (error.message === "INVALID_REQUEST_STATUS") {
      return res.status(422).json({
        error: {
          code: "INVALID_REQUEST_STATUS",
          message:
            "Request status must be OPEN, IN_PROGRESS, RESOLVED, or REJECTED"
        }
      });
    }

    if (error.message === "REQUEST_STATUS_UNCHANGED") {
      return res.status(409).json({
        error: {
          code: "REQUEST_STATUS_UNCHANGED",
          message: "Request already has this status"
        }
      });
    }

    if (error.message === "FORBIDDEN") {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Only the assigned recipient can update this request" }
      });
    }

    if (error.message === "INVALID_REQUEST_TRANSITION") {
      return res.status(409).json({
        error: { code: "INVALID_REQUEST_TRANSITION", message: "This request can no longer change to that status" }
      });
    }

    res.status(500).json({
      error: {
        code: "REQUEST_STATUS_UPDATE_FAILED",
        message: "Unable to update request status"
      }
    });
  }
}

module.exports = {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequestStatus
};