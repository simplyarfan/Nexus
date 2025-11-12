/**
 * Centralized Error Handler Middleware
 * Provides consistent error responses across all endpoints
 */

class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming errors

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error types for standardized error handling
 */
const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
};

/**
 * Standardized error response format
 */
const errorResponse = (error, req, res) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const response = {
    success: false,
    error: {
      message: error.message || 'An unexpected error occurred',
      code: error.code || ErrorTypes.SERVER_ERROR,
      statusCode: error.statusCode || 500,
    },
  };

  // Add details in development or for operational errors
  if (isDevelopment && error.details) {
    response.error.details = error.details;
  }

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    response.error.stack = error.stack;
  }

  // Add request ID if available
  if (req.headers['x-request-id']) {
    response.error.requestId = req.headers['x-request-id'];
  }

  // Log error

  res.status(error.statusCode || 500).json(response);
};

/**
 * Main error handler middleware
 */
const errorHandler = (err, req, res, _next) => {
  // Handle known operational errors
  if (err.isOperational) {
    return errorResponse(err, req, res);
  }

  // Handle Sequelize/Database errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const appError = new AppError(
      'Validation error',
      400,
      ErrorTypes.VALIDATION_ERROR,
      err.errors?.map((e) => ({ field: e.path, message: e.message })),
    );
    return errorResponse(appError, req, res);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const appError = new AppError('Invalid token', 401, ErrorTypes.AUTHENTICATION_ERROR);
    return errorResponse(appError, req, res);
  }

  if (err.name === 'TokenExpiredError') {
    const appError = new AppError('Token expired', 401, ErrorTypes.AUTHENTICATION_ERROR);
    return errorResponse(appError, req, res);
  }

  // Handle express-validator errors
  if (err.array && typeof err.array === 'function') {
    const appError = new AppError(
      'Validation error',
      400,
      ErrorTypes.VALIDATION_ERROR,
      err.array(),
    );
    return errorResponse(appError, req, res);
  }

  // Handle syntax errors (malformed JSON, etc.)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const appError = new AppError('Invalid JSON payload', 400, ErrorTypes.VALIDATION_ERROR);
    return errorResponse(appError, req, res);
  }

  // Handle unknown/programming errors
  const appError = new AppError(
    process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    500,
    ErrorTypes.SERVER_ERROR,
  );
  appError.stack = err.stack;

  return errorResponse(appError, req, res);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, ErrorTypes.NOT_FOUND);
  next(error);
};

/**
 * Async error wrapper for route handlers
 * Eliminates need for try-catch in every async route
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Helper functions for throwing common errors
 */
const throwValidationError = (message, details = null) => {
  throw new AppError(message, 400, ErrorTypes.VALIDATION_ERROR, details);
};

const throwAuthenticationError = (message = 'Authentication required') => {
  throw new AppError(message, 401, ErrorTypes.AUTHENTICATION_ERROR);
};

const throwAuthorizationError = (message = 'Insufficient permissions') => {
  throw new AppError(message, 403, ErrorTypes.AUTHORIZATION_ERROR);
};

const throwNotFoundError = (resource = 'Resource') => {
  throw new AppError(`${resource} not found`, 404, ErrorTypes.NOT_FOUND);
};

const throwConflictError = (message) => {
  throw new AppError(message, 409, ErrorTypes.CONFLICT);
};

const throwRateLimitError = (message = 'Too many requests') => {
  throw new AppError(message, 429, ErrorTypes.RATE_LIMIT);
};

module.exports = {
  AppError,
  ErrorTypes,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  throwValidationError,
  throwAuthenticationError,
  throwAuthorizationError,
  throwNotFoundError,
  throwConflictError,
  throwRateLimitError,
};
