/**
 * Standardized API Response Utilities
 * Provides consistent success and error response formats
 */

/**
 * Standard success response format
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {String} message - Optional success message
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
const successResponse = (res, data = null, message = null, statusCode = 200) => {
  const response = {
    success: true,
  };

  if (message) {
    response.message = message;
  }

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Success response for created resources
 * @param {Object} res - Express response object
 * @param {Object} data - Created resource data
 * @param {String} message - Success message
 */
const createdResponse = (res, data, message = 'Resource created successfully') => {
  return successResponse(res, data, message, 201);
};

/**
 * Success response with no content
 * @param {Object} res - Express response object
 */
const noContentResponse = (res) => {
  return res.status(204).send();
};

/**
 * Paginated response format
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination metadata
 */
const paginatedResponse = (res, data, pagination) => {
  const response = {
    success: true,
    data,
    pagination: {
      currentPage: pagination.page || 1,
      pageSize: pagination.limit || data.length,
      totalItems: pagination.total || data.length,
      totalPages: pagination.totalPages || 1,
      hasNextPage: pagination.hasNextPage || false,
      hasPreviousPage: pagination.hasPreviousPage || false,
    },
  };

  return res.status(200).json(response);
};

/**
 * Error response format (for direct usage, middleware handles most errors)
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code
 * @param {String} code - Error code
 * @param {Object} details - Additional error details
 */
const errorResponse = (res, message, statusCode = 500, code = 'SERVER_ERROR', details = null) => {
  const response = {
    success: false,
    error: {
      message,
      code,
      statusCode,
    },
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  createdResponse,
  noContentResponse,
  paginatedResponse,
  errorResponse,
};
