const { error } = require('../utils/response');

/**
 * Zod validation middleware factory
 * Usage: validate(myZodSchema)
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const formattedErrors = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return error(res, 'Validation failed', 400, formattedErrors);
      }

      // Replace body with parsed (and potentially transformed) data
      req.body = result.data;
      next();
    } catch (err) {
      return error(res, 'Validation error', 400);
    }
  };
};

/**
 * Validate query parameters
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        const formattedErrors = result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return error(res, 'Invalid query parameters', 400, formattedErrors);
      }
      req.query = result.data;
      next();
    } catch (err) {
      return error(res, 'Query validation error', 400);
    }
  };
};

module.exports = { validate, validateQuery };
