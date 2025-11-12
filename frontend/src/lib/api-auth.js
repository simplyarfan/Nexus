/**
 * API Authentication Helper for Next.js API Routes
 *
 * Provides JWT verification and user extraction for server-side API routes.
 * Reuses the same JWT_SECRET as the backend for consistency.
 */

import jwt from 'jsonwebtoken';

/**
 * Verify JWT token and extract user information
 *
 * @param {object} req - Next.js API request object
 * @returns {Promise<{user: object} | {error: string, status: number}>}
 */
export async function authenticateRequest(req) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        error: 'No token provided',
        status: 401,
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.id) {
      return {
        error: 'Invalid token',
        status: 401,
      };
    }

    // Return user information
    return {
      user: {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        first_name: decoded.first_name,
        last_name: decoded.last_name,
      },
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return {
        error: 'Token expired',
        status: 401,
      };
    }

    if (error.name === 'JsonWebTokenError') {
      return {
        error: 'Invalid token',
        status: 401,
      };
    }

    return {
      error: 'Authentication failed',
      status: 500,
    };
  }
}

/**
 * Check if user has required role
 *
 * @param {object} user - User object from authenticateRequest
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {boolean}
 */
export function hasRole(user, allowedRoles) {
  return allowedRoles.includes(user.role);
}

/**
 * Middleware wrapper for API routes with authentication
 *
 * @param {Function} handler - The API route handler
 * @param {object} options - Configuration options
 * @param {string[]} options.allowedRoles - Optional: Array of allowed roles
 * @returns {Function}
 */
export function withAuth(handler, options = {}) {
  return async (req, res) => {
    // Authenticate request
    const authResult = await authenticateRequest(req);

    if (authResult.error) {
      return res.status(authResult.status).json({
        success: false,
        error: authResult.error,
      });
    }

    // Check role if specified
    if (options.allowedRoles && !hasRole(authResult.user, options.allowedRoles)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    // Attach user to request
    req.user = authResult.user;

    // Call the actual handler
    return handler(req, res);
  };
}
