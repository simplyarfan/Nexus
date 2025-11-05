const rateLimit = require('express-rate-limit');

// Shared rate limiter config for Vercel/production
const baseConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  // Trust Vercel's proxy (required for serverless)
  trustProxy: true,
};

// General API rate limiting
const generalLimiter = rateLimit({
  ...baseConfig,
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX || 100), // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000) / 1000),
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes.',
    retryAfter: 15 * 60,
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Password reset rate limiting
const passwordResetLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again in 1 hour.',
    retryAfter: 60 * 60,
  },
});

// Email verification rate limiting
const emailVerificationLimiter = rateLimit({
  ...baseConfig,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 verification email requests per 5 minutes
  message: {
    success: false,
    message: 'Too many verification email requests, please try again in 5 minutes.',
    retryAfter: 5 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiting
const uploadLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 file uploads per hour
  message: {
    success: false,
    message: 'Too many file uploads, please try again in 1 hour.',
    retryAfter: 60 * 60,
  },
});

// CV batch creation rate limiting
const cvBatchLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 CV batches per hour
  message: {
    success: false,
    message: 'Too many CV batch creation requests, please try again in 1 hour.',
    retryAfter: 60 * 60,
  },
});

// Support ticket rate limiting
const ticketLimiter = rateLimit({
  ...baseConfig,
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // 10 support tickets per day
  message: {
    success: false,
    message: 'Too many support tickets created today, please try again tomorrow.',
    retryAfter: 24 * 60 * 60,
  },
});

// API documentation rate limiting (more lenient)
const docsLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window for docs
  message: {
    success: false,
    message: 'Too many requests to documentation endpoints.',
    retryAfter: 15 * 60,
  },
});

// Analytics rate limiting (for admins)
const analyticsLimiter = rateLimit({
  ...baseConfig,
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 analytics requests per 5 minutes
  message: {
    success: false,
    message: 'Too many analytics requests, please try again in 5 minutes.',
    retryAfter: 5 * 60,
  },
});

// Export rate limiting
const exportLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 exports per hour
  message: {
    success: false,
    message: 'Too many export requests, please try again in 1 hour.',
    retryAfter: 60 * 60,
  },
});

// Create a custom rate limiter factory
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false,
  } = options;

  return rateLimit({
    ...baseConfig,
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    skipSuccessfulRequests,
  });
};

// IP-based strict limiting for suspicious activity
const strictLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Only 10 requests per hour for strict endpoints
  message: {
    success: false,
    message: 'Access temporarily restricted. Please try again later.',
    retryAfter: 60 * 60,
  },
});

// Dynamic rate limiting based on user role
const createRoleBasedLimiter = (limits = {}) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'anonymous';

    const roleLimits = {
      anonymous: { windowMs: 15 * 60 * 1000, max: 20 },
      user: { windowMs: 15 * 60 * 1000, max: 100 },
      admin: { windowMs: 15 * 60 * 1000, max: 500 },
      superadmin: { windowMs: 15 * 60 * 1000, max: 1000 },
      ...limits,
    };

    const limit = roleLimits[userRole] || roleLimits.anonymous;

    const limiter = rateLimit({
      ...baseConfig,
      windowMs: limit.windowMs,
      max: limit.max,
      message: {
        success: false,
        message: `Too many requests for ${userRole} role, please try again later.`,
        retryAfter: Math.ceil(limit.windowMs / 1000),
      },
      keyGenerator: (req) => {
        // Use user ID for authenticated users, IP for anonymous
        return req.user?.id ? `user:${req.user.id}` : req.ip;
      },
    });

    return limiter(req, res, next);
  };
};

// Burst protection for high-value endpoints
const burstProtection = rateLimit({
  ...baseConfig,
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    message: 'Too many rapid requests, please slow down.',
    retryAfter: 60,
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  uploadLimiter,
  cvBatchLimiter,
  ticketLimiter,
  docsLimiter,
  analyticsLimiter,
  exportLimiter,
  strictLimiter,
  burstProtection,
  createRateLimiter,
  createRoleBasedLimiter,
};
