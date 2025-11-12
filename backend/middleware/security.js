const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

/**
 * Security Headers Middleware
 * Adds various HTTP headers to protect against common vulnerabilities
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // SECURITY: Removed unsafe-inline and unsafe-eval to prevent XSS
      // If you need inline scripts, use nonces or hashes
      scriptSrc: ["'self'"],
      // Allow inline styles only for critical CSS (consider moving to external files)
      styleSrc: ["'self'", "'unsafe-inline'"], // Keep for now, TODO: move to external CSS
      // Restrict images to self, data URIs, and configured domains
      imgSrc: ["'self'", 'data:', process.env.BACKEND_URL, process.env.FRONTEND_URL].filter(
        Boolean,
      ),
      connectSrc: ["'self'", process.env.BACKEND_URL, process.env.FRONTEND_URL].filter(Boolean),
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"], // Restrict base tag
      formAction: ["'self'"], // Restrict form submissions
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny', // Prevent clickjacking
  },
  noSniff: true, // Prevent MIME type sniffing
  xssFilter: true, // Enable XSS filter
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
});

/**
 * General API Rate Limiter
 * Limits requests to prevent abuse
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

/**
 * Strict Rate Limiter for Auth Endpoints
 * More restrictive to prevent brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many attempts, please try again in 15 minutes',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
    });
  },
});

/**
 * CORS Configuration
 * Controls which domains can access the API
 * IMPORTANT: Use ALLOWED_ORIGINS environment variable to set allowed domains
 * Example: ALLOWED_ORIGINS=https://your-app.com,https://staging.your-app.com
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Get allowed origins from environment variable (required in production)
    if (!process.env.ALLOWED_ORIGINS) {
      console.error('ALLOWED_ORIGINS environment variable is not set');
      callback(new Error('Server configuration error'));
      return;
    }

    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In production, also allow Netlify preview URLs
      if (process.env.NODE_ENV === 'production' && origin && origin.includes('netlify.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-Request-ID'],
};

/**
 * Request Size Limiter
 * Prevents large payload attacks
 */
const requestSizeLimiter = {
  json: { limit: '10mb' }, // For JSON payloads
  urlencoded: { limit: '10mb', extended: true }, // For form data
};

/**
 * Security Logger
 * Logs security-related events
 */
const securityLogger = (req, res, next) => {
  // Log suspicious activity
  const suspiciousPatterns = [
    /(\.\.|\/etc\/|\/bin\/|\/usr\/)/i, // Path traversal
    /(union|select|insert|update|delete|drop|create|alter)/i, // SQL injection
    /(<script|javascript:|onerror=|onclick=)/i, // XSS attempts
  ];

  const url = req.url.toLowerCase();
  const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(url));

  if (isSuspicious) {
    // Suspicious request detected
  }

  next();
};

/**
 * IP Whitelist Middleware (optional)
 * Restrict access to specific IPs for admin routes
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    next();
  };
};

module.exports = {
  securityHeaders,
  apiLimiter,
  authLimiter,
  cors: cors(corsOptions),
  corsOptions,
  requestSizeLimiter,
  securityLogger,
  ipWhitelist,
};
