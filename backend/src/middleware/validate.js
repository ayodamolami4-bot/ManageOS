function validateRequest(
  schema,
  source
) {
  return (req, res, next) => {
    const result =
      schema.safeParse(
        req[source]
      );

    if (!result.success) {
      return res.status(400).json({
        error: {
          code:
            "VALIDATION_ERROR",
          message:
            "Invalid request data",
          details:
            result.error.issues.map(
              (issue) => ({
                field:
                  issue.path.join("."),
                message:
                  issue.message
              })
            )
        }
      });
    }

    req[source] =
      result.data;

    next();
  };
}

function validateBody(schema) {
  return validateRequest(
    schema,
    "body"
  );
}

function validateParams(schema) {
  return validateRequest(
    schema,
    "params"
  );
}

function validateQuery(schema) {
  return validateRequest(
    schema,
    "query"
  );
}

module.exports = {
  validateBody,
  validateParams,
  validateQuery
};