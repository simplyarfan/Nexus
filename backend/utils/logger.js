const winston = require('winston');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  }),
);

// Define log format for JSON (production/serverless)
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Create the logger - CONSOLE ONLY for serverless compatibility
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? jsonFormat : logFormat,
  defaultMeta: { service: 'ai-platform' },
  transports: [
    // Console transport (works in all environments including serverless)
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'production'
          ? jsonFormat
          : winston.format.combine(winston.format.colorize(), logFormat),
    }),
  ],
});

// Add request logging helper
logger.logRequest = (req, res, duration) => {
  const logData = {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };

  if (res.statusCode >= 400) {
    logger.warn('Request failed', logData);
  } else {
    logger.info('Request completed', logData);
  }
};

// Add security event logging
logger.logSecurityEvent = (event, details) => {
  logger.warn('Security Event', {
    event,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

// Add database query logging
logger.logQuery = (query, duration, error = null) => {
  if (error) {
    logger.error('Database query failed', {
      query: query.substring(0, 100), // Truncate long queries
      duration: `${duration}ms`,
      error: error.message,
    });
  } else if (duration > 1000) {
    // Log slow queries
    logger.warn('Slow query detected', {
      query: query.substring(0, 100),
      duration: `${duration}ms`,
    });
  } else if (process.env.LOG_LEVEL === 'debug') {
    logger.debug('Query executed', {
      query: query.substring(0, 100),
      duration: `${duration}ms`,
    });
  }
};

// Add development-only logging helper
logger.dev = (...args) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

// Add conditional logging (skip certain paths)
logger.shouldLog = (req) => {
  const skipPaths = ['/health', '/favicon.ico', '/api/test'];
  return !skipPaths.some((path) => req.url.includes(path));
};

module.exports = logger;
