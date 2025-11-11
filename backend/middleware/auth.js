const jwt = require('jsonwebtoken');
const database = require('../models/database');

// JWT Authentication Middleware - Enterprise Grade
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log(`🔐 [AUTH] ${req.method} ${req.path}`);
    console.log(`🔐 [AUTH] Authorization header:`, authHeader ? `${authHeader.substring(0, 30)}...` : 'missing');

    if (!token) {
      console.error('❌ [AUTH] No token provided');
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
      console.log('🔑 [AUTH] Verifying token with JWT_SECRET:', process.env.JWT_SECRET.substring(0, 20) + '...');
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ [AUTH] Token verified for user ID:', decoded.userId);
    } catch (jwtError) {
      console.error('❌ [AUTH] Token verification failed:', jwtError.message);
      console.error('🔑 [AUTH] JWT_SECRET used for verification:', process.env.JWT_SECRET.substring(0, 20) + '...');
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
        console.error('Error tracking activity:', error);
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

module.exports = {
  authenticateToken,
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  validateCompanyDomain,
  trackActivity,
  cleanupExpiredSessions,
};
