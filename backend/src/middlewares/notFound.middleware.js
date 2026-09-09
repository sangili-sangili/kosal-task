/**
 * 404 Route Not Found Middleware
 */
const { NotFoundError } = require('../utils/errors');

const notFoundMiddleware = (req, res, next) => {
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
};

module.exports = notFoundMiddleware;
