/**
 * Centralized API Response Helpers
 */

const sendSuccess = (res, message = 'Success', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendCreated = (res, message = 'Resource created successfully', data = {}) => {
  return sendSuccess(res, message, data, 201);
};

const sendPaginated = (
  res,
  message = 'Data retrieved successfully',
  data = [],
  pagination = { page: 1, limit: 20, total: 0, totalPages: 0 },
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
  });
};

const sendError = (res, message = 'An error occurred', errorCode = 'INTERNAL_ERROR', details = null, statusCode = 500) => {
  const payload = {
    success: false,
    message,
    error: {
      code: errorCode,
    },
  };

  if (details && process.env.NODE_ENV !== 'production') {
    payload.error.details = details;
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  sendSuccess,
  sendCreated,
  sendPaginated,
  sendError,
};
