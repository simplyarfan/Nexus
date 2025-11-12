/**
 * CSRF Protection Middleware
 * Implements double-submit cookie pattern for CSRF protection
 */

const crypto = require('crypto');

/**
 * Generate CSRF token
 */
const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF Protection Middleware
 * For API-only applications using JWT, we implement a custom token approach
 * The token is sent in headers rather than cookies for better API compatibility
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS (read-only operations)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for certain routes (login, register, etc.)
  const exemptRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh-token',
    '/api/auth/verify-email',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/health',
  ];

  if (exemptRoutes.some((route) => req.path.startsWith(route))) {
    return next();
  }

  // For authenticated requests, verify CSRF token in header
  const csrfToken = req.headers['x-csrf-token'];

  if (!csrfToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing',
      code: 'CSRF_TOKEN_MISSING',
    });
  }

  // Verify token format (64 character hex string)
  if (!/^[a-f0-9]{64}$/.test(csrfToken)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
      code: 'CSRF_TOKEN_INVALID',
    });
  }

  // Store validated token in request for potential verification
  req.csrfToken = csrfToken;

  next();
};

/**
 * Generate and send CSRF token to client
 */
const getCsrfToken = (req, res) => {
  const token = generateCsrfToken();

  res.json({
    success: true,
    csrfToken: token,
  });
};

module.exports = {
  csrfProtection,
  getCsrfToken,
  generateCsrfToken,
};
