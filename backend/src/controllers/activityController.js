const {
  getActivities,
  getActivity
} = require("../services/activityService");

async function getCompanyActivities(req, res) {
  try {
    const activities = await getActivities(
      req.user,
      req.query
    );

    res.status(200).json({
      data: activities,
      message: "Activities retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Activity retrieval failed:",
      error
    );

    if (error.message === "INVALID_ACTIVITY_FILTERS") {
      return res.status(400).json({
        error: {
          code: "INVALID_ACTIVITY_FILTERS",
          message: "Invalid activity filters"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "ACTIVITIES_RETRIEVAL_FAILED",
        message: "Unable to retrieve activities"
      }
    });
  }
}

async function getActivityById(req, res) {
  try {
    const activity = await getActivity(
      req.params.activityId,
      req.user
    );

    res.status(200).json({
      data: activity,
      message: "Activity retrieved successfully"
    });
  } catch (error) {
    console.error(
      "Activity retrieval failed:",
      error
    );

    if (error.message === "ACTIVITY_NOT_FOUND") {
      return res.status(404).json({
        error: {
          code: "ACTIVITY_NOT_FOUND",
          message: "Activity not found"
        }
      });
    }

    res.status(500).json({
      error: {
        code: "ACTIVITY_RETRIEVAL_FAILED",
        message: "Unable to retrieve activity"
      }
    });
  }
}

module.exports = {
  getCompanyActivities,
  getActivityById
};