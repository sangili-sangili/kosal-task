const crypto = require('crypto');
const logger = require('../config/logger');

function requestLogger(req, res, next) {
  // Attach correlation ID
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  const startTime = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(startTime);
    const timeMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

    const logMessage = `${method} ${originalUrl} ${statusCode} - ${timeMs}ms - [${ip}] [ReqID: ${requestId}]`;

    if (statusCode >= 500) {
      logger.error(logMessage);
    } else if (statusCode >= 400) {
      logger.warn(logMessage);
    } else {
      logger.info(logMessage);
    }
  });

  next();
}

module.exports = requestLogger;
