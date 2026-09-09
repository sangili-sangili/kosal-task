const { HTTP_STATUS } = require('../constants/httpStatusCodes');

class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = HTTP_STATUS.OK, pagination = null) {
    const response = {
      success: true,
      message,
      data,
    };

    if (pagination) {
      response.pagination = pagination;
    }

    return res.status(statusCode).json(response);
  }

  static created(res, data = null, message = 'Resource created successfully') {
    return this.success(res, data, message, HTTP_STATUS.CREATED);
  }

  static noContent(res) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }

  static error(res, message = 'An error occurred', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode = 'ERROR', errors = null) {
    const response = {
      success: false,
      message,
      data: null,
      error: {
        code: errorCode,
      },
    };

    if (errors) {
      response.error.details = errors;
    }

    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;
