/**
 * Serverless Middleware Wrapper
 * Handles CORS, auth, and error handling for all API routes
 */

const { verifyAccessToken } = require('../lib/auth');

/**
 * CORS Configuration
 * IMPORTANT: Use ALLOWED_ORIGINS environment variable to set allowed domains
 * Example: ALLOWED_ORIGINS=https://your-app.com,https://staging.your-app.com
 */
const getCorsHeaders = (origin) => {
  if (!process.env.ALLOWED_ORIGINS) {
    console.error('ALLOWED_ORIGINS environment variable is not set');
    return {
      'Access-Control-Allow-Origin': 'null',
      'Access-Control-Allow-Credentials': 'false',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
      'Access-Control-Allow-Headers':
        'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-Request-ID',
      'Access-Control-Expose-Headers': 'Content-Length,X-Request-ID',
    };
  }

  const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());

  // Allow configured origins and preview deployments (Netlify/Vercel)
  const isAllowed =
    allowedOrigins.includes(origin) ||
    (process.env.NODE_ENV === 'production' &&
      origin &&
      (origin.includes('netlify.app') || origin.includes('vercel.app')));

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0],
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    'Access-Control-Allow-Headers':
      'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-Request-ID',
    'Access-Control-Expose-Headers': 'Content-Length,X-Request-ID',
  };
};

/**
 * Apply CORS headers
 */
const withCors = (handler) => async (req, res) => {
  const origin = req.headers.origin || req.headers.referer;
  const corsHeaders = getCorsHeaders(origin);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return handler(req, res);
};

/**
 * Authentication middleware for protected routes
 */
const withAuth = (handler) => async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    // Attach user to request
    req.user = decoded;

    return handler(req, res);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid authentication token',
    });
  }
};

/**
 * Admin role check middleware
 */
const withAdmin = (handler) => async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }

  return handler(req, res);
};

/**
 * Superadmin role check middleware
 */
const withSuperAdmin = (handler) => async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Superadmin access required',
    });
  }

  return handler(req, res);
};

/**
 * Error handling wrapper
 */
const withErrorHandling = (handler) => async (req, res) => {
  try {
    return await handler(req, res);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const isDevelopment = process.env.NODE_ENV === 'development';

    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error',
      ...(isDevelopment && { stack: error.stack }),
    });
  }
};

/**
 * Complete middleware wrapper (CORS + Error Handling)
 */
const withMiddleware = (handler) => {
  return withCors(withErrorHandling(handler));
};

/**
 * Protected route wrapper (CORS + Auth + Error Handling)
 */
const withProtectedRoute = (handler) => {
  return withCors(withAuth(withErrorHandling(handler)));
};

/**
 * Admin route wrapper (CORS + Auth + Admin Check + Error Handling)
 */
const withAdminRoute = (handler) => {
  return withCors(withAuth(withAdmin(withErrorHandling(handler))));
};

/**
 * Superadmin route wrapper (CORS + Auth + Superadmin Check + Error Handling)
 */
const withSuperAdminRoute = (handler) => {
  return withCors(withAuth(withSuperAdmin(withErrorHandling(handler))));
};

module.exports = {
  withCors,
  withAuth,
  withAdmin,
  withSuperAdmin,
  withErrorHandling,
  withMiddleware,
  withProtectedRoute,
  withAdminRoute,
  withSuperAdminRoute,
};
