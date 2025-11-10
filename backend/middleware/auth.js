/**
 * Authentication Middleware (Production Ready - Prisma)
 * JWT-based authentication with role-based authorization
 */

const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
      });
    }

    // Verify JWT token
    let decoded;
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required');
      }
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Get user details from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        is_active: true,
        department: true,
        job_title: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Add user to request object
    req.user = user;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string|array} roles - Required role(s)
 */
const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Convert single role to array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Superadmin only middleware
 */
const requireSuperAdmin = requireRole(['superadmin']);

/**
 * Admin or Superadmin middleware
 */
const requireAdmin = requireRole(['admin', 'superadmin']);

/**
 * Company domain validation middleware
 */
const validateCompanyDomain = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  const emailDomain = email.split('@')[1];
  const allowedDomain = process.env.COMPANY_DOMAIN || 'securemaxtech.com';

  if (emailDomain !== allowedDomain) {
    return res.status(403).json({
      success: false,
      message: `Only ${allowedDomain} email addresses are allowed`,
    });
  }

  next();
};

/**
 * Track user activity middleware
 * Note: Requires user_analytics table in schema (currently not present)
 */
const trackActivity = (action, agent_id = null) => {
  return async (req, res, next) => {
    if (req.user) {
      try {
        const metadata = {
          path: req.path,
          method: req.method,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
        };

        // NOTE: This requires a user_analytics table in Prisma schema
        // Skipping for now to avoid errors
        // await prisma.userAnalytics.create({
        //   data: {
        //     user_id: req.user.id,
        //     action: action,
        //     agent_id: agent_id,
        //     metadata: JSON.stringify(metadata),
        //   },
        // });
      } catch (error) {
        console.error('Error tracking activity:', error);
        // Don't fail the request if analytics fails
      }
    }
    next();
  };
};

/**
 * Session cleanup middleware
 * Removes expired sessions from database
 */
const cleanupExpiredSessions = async (req, res, next) => {
  try {
    // Delete expired sessions (runs in background, doesn't block request)
    prisma.userSession
      .deleteMany({
        where: {
          expires_at: {
            lt: new Date(),
          },
        },
      })
      .catch((err) => console.error('Session cleanup error:', err));
  } catch (error) {
    console.error('Session cleanup error:', error);
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  validateCompanyDomain,
  trackActivity,
  cleanupExpiredSessions,
};
