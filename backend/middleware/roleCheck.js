/**
 * Role-based access control middleware
 * Verifies user has required role(s) to access endpoint
 */

const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    // Auth middleware should have already verified JWT and attached user to req
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role;

    // Check if user has one of the allowed roles
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. This action requires elevated privileges.',
        requiredRoles: allowedRoles,
        userRole: userRole,
      });
    }

    // User has required role, proceed
    next();
  };
};

// Convenience middleware exports
const requireSuperAdmin = roleCheck('superadmin');
const requireAdmin = roleCheck('admin', 'superadmin');
const requireUser = roleCheck('user', 'admin', 'superadmin');

module.exports = {
  roleCheck,
  requireSuperAdmin,
  requireAdmin,
  requireUser,
};
