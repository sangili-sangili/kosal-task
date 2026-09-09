const { BadRequestError } = require('../errors');

/**
 * Middleware factory for Zod schema validation
 * @param {Object} schemas - { body, query, params } Zod schemas
 */
function validate(schemas) {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      return next();
    } catch (error) {
      if (error.errors) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(new BadRequestError('Validation failed', formattedErrors));
      }
      return next(error);
    }
  };
}

module.exports = validate;
