const jwt = require('jsonwebtoken');
const database = require('../models/database');
const cryptoUtil = require('../utils/crypto');

// JWT Authentication Middleware - Enterprise Grade
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

    // Ensure database connection
    await database.connect();

    // Get user details directly from database
    const user = await database.get(
      'SELECT id, email, first_name, last_name, role, is_active, department, job_title FROM users WHERE id = $1',
      [decoded.userId],
    );

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

    // SECURITY: Validate session exists in database and is not expired
    // Hash the token before comparing with database (tokens are stored as SHA256 hashes)
    const hashedToken = cryptoUtil.hash(token);

    const session = await database.get(
      'SELECT id, expires_at FROM user_sessions WHERE session_token = $1 AND user_id = $2',
      [hashedToken, decoded.userId],
    );

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid. Please login again.',
      });
    }

    // Check if session has expired
    const sessionExpiry = new Date(session.expires_at);
    if (sessionExpiry < new Date()) {
      // Clean up expired session
      await database.run('DELETE FROM user_sessions WHERE id = $1', [session.id]);
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
      });
    }

    // Add user to request object
    req.user = user;

    next();
  } catch (error) {
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

// Role-based authorization middleware
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

// Superadmin only middleware
const requireSuperAdmin = requireRole(['superadmin']);

// Admin or Superadmin middleware
const requireAdmin = requireRole(['admin', 'superadmin']);

// Company domain validation middleware
const validateCompanyDomain = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  if (!process.env.COMPANY_DOMAIN) {
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: COMPANY_DOMAIN environment variable is required',
    });
  }

  const emailDomain = email.split('@')[1];
  const allowedDomain = process.env.COMPANY_DOMAIN;

  if (emailDomain !== allowedDomain) {
    return res.status(403).json({
      success: false,
      message: `Only ${allowedDomain} email addresses are allowed`,
    });
  }

  next();
};

// Track user activity middleware
const trackActivity = (action, agent_id = null) => {
  return async (req, res, next) => {
    if (req.user) {
      try {
        await database.connect();

        const metadata = {
          path: req.path,
          method: req.method,
          ip_address: req.ip,
          user_agent: req.get('User-Agent'),
        };

        await database.run(
          `
    INSERT INTO user_analytics (user_id, action, agent_id, metadata, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `,
          [req.user.id, action, agent_id, JSON.stringify(metadata)],
        );
      } catch (error) {
        // Don't fail the request if analytics fails
      }
    }
    next();
  };
};

// Session cleanup middleware
const cleanupExpiredSessions = async (req, res, next) => {
  next(); // Skip session cleanup for now - will implement proper session management later
};

// HR Department access middleware
const requireHRAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Allow superadmins full access
  if (req.user.role === 'superadmin') {
    return next();
  }

  // Allow admins with HR department (accepts both "HR" and "Human Resources")
  const isHRDepartment = req.user.department === 'HR' || req.user.department === 'Human Resources';

  if (req.user.role === 'admin' && isHRDepartment) {
    req.user.isHRAdmin = true;
    return next();
  }

  // Allow regular users with HR department
  if (isHRDepartment) {
    req.user.isHRAdmin = false;
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. This feature requires HR department access.',
  });
};

// HR Admin only middleware (for create/delete operations)
const requireHRAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Allow superadmins
  if (req.user.role === 'superadmin') {
    return next();
  }

  // Allow admins with HR department (accepts both "HR" and "Human Resources")
  const isHRDepartment = req.user.department === 'HR' || req.user.department === 'Human Resources';

  if (req.user.role === 'admin' && isHRDepartment) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied. This operation requires HR admin privileges.',
  });
};

module.exports = {
  authenticateToken,
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  requireHRAccess,
  requireHRAdmin,
  validateCompanyDomain,
  trackActivity,
  cleanupExpiredSessions,
};
