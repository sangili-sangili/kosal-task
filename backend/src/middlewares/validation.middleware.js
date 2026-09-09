/**
 * Centralized Request Validation Middleware (Zod Schema Validation)
 * Validates req.body, req.query, and req.params before reaching controllers/services
 */
const { ValidationError } = require('../utils/errors');

/**
 * Middleware factory for Zod schema validation
 * @param {Object} schemas - Optional schemas: { body, query, params }
 */
function validationMiddleware(schemas = {}) {
  return async (req, res, next) => {
    try {
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      return next();
    } catch (error) {
      if (error.errors && Array.isArray(error.errors)) {
        const fieldErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(new ValidationError('Validation failed', fieldErrors));
      }
      return next(error);
    }
  };
}

module.exports = validationMiddleware;
