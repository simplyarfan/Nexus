const express = require('express');
const router = express.Router();
const HRAnalyticsController = require('../controllers/HRAnalyticsController');
const { authenticateToken, requireSuperAdmin, trackActivity } = require('../middleware/auth');
const { analyticsLimiter } = require('../middleware/rateLimiting');
const { validatePagination, validateUserId } = require('../middleware/validation');

// All Recruitment analytics routes require superadmin access
router.use(authenticateToken);
router.use(requireSuperAdmin);
router.use(analyticsLimiter);

// Get Recruitment user statistics (aggregate interview stats per recruiter)
router.get(
  '/users',
  trackActivity('hr_analytics_users_viewed'),
  HRAnalyticsController.getHRUserStats,
);

// Get outcome statistics for charts (selection/rejection data)
router.get(
  '/outcomes',
  trackActivity('hr_analytics_outcomes_viewed'),
  HRAnalyticsController.getOutcomeStats,
);

// Get all interviews with interviewer details (for table view)
router.get(
  '/interviews',
  validatePagination,
  trackActivity('hr_analytics_interviews_viewed'),
  HRAnalyticsController.getAllInterviews,
);

// Get candidates interviewed by a specific recruiter
router.get(
  '/users/:user_id/candidates',
  validateUserId,
  validatePagination,
  trackActivity('hr_analytics_candidates_viewed'),
  HRAnalyticsController.getCandidatesByInterviewer,
);

module.exports = router;
