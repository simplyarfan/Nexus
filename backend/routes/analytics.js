const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/AnalyticsController');
const { authenticateToken, requireSuperAdmin, trackActivity } = require('../middleware/auth');
const { analyticsLimiter, exportLimiter } = require('../middleware/rateLimiting');
const {
  validatePagination,
  validateTimeframe,
  validateUserId,
  validateAgentId,
  validateExportFormat,
} = require('../middleware/validation');

// All analytics routes require superadmin access
router.use(authenticateToken);
router.use(requireSuperAdmin);
router.use(analyticsLimiter);

// Dashboard overview statistics
router.get(
  '/dashboard',
  trackActivity('analytics_dashboard_viewed'),
  AnalyticsController.getDashboard,
);

// User analytics
router.get(
  '/users',
  validatePagination,
  validateTimeframe,
  trackActivity('user_analytics_viewed'),
  AnalyticsController.getUserAnalytics,
);

// Agent usage analytics
router.get(
  '/agents',
  validateTimeframe,
  trackActivity('agent_analytics_viewed'),
  AnalyticsController.getAgentAnalytics,
);

// CV Intelligence analytics
router.get(
  '/cv-intelligence',
  validateTimeframe,
  trackActivity('cv_analytics_viewed'),
  AnalyticsController.getCVAnalytics,
);

// System analytics
router.get(
  '/system',
  validateTimeframe,
  trackActivity('system_analytics_viewed'),
  AnalyticsController.getSystemAnalytics,
);

// Detailed user activity
router.get(
  '/users/:user_id/activity',
  validateUserId,
  validatePagination,
  trackActivity('user_activity_viewed'),
  AnalyticsController.getUserActivity,
);

// Export analytics data
router.get(
  '/export',
  exportLimiter,
  validateTimeframe,
  validateExportFormat,
  trackActivity('analytics_exported'),
  AnalyticsController.exportAnalytics,
);

module.exports = router;
