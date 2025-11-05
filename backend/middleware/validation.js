const { body, param, query } = require('express-validator');

// User registration validation
const validateRegistration = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    ),

  body('first_name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be between 1-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('last_name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be between 1-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),

  body('job_title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title must be less than 100 characters'),
];

// User login validation
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),

  body('password').notEmpty().withMessage('Password is required'),
];

// Email verification validation
const validateEmailVerification = [
  body('token').isUUID().withMessage('Invalid verification token format'),
];

// Password reset request validation
const validatePasswordResetRequest = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
];

// Password reset validation
const validatePasswordReset = [
  body('token')
    .isLength({ min: 64, max: 64 })
    .isHexadecimal()
    .withMessage('Invalid reset token format'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    ),
];

// Profile update validation
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('currentPassword')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Current password is required when changing password'),

  body('newPassword')
    .optional()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long'),
];

// Notification validation
const validateNotificationId = [
  param('notification_id').isInt({ min: 1 }).withMessage('Valid notification ID is required'),
];

// Support ticket creation validation
const validateTicketCreation = [
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5-200 characters'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10-2000 characters'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),

  body('category')
    .optional()
    .isIn(['general', 'bug', 'feature_request', 'technical_support'])
    .withMessage('Category must be one of: general, bug, feature_request, technical_support'),
];

// Support ticket comment validation
const validateTicketComment = [
  body('comment')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1-1000 characters'),

  body('is_internal').optional().isBoolean().withMessage('is_internal must be a boolean value'),
];

// Support ticket update validation
const validateTicketUpdate = [
  body('subject')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5-200 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10-2000 characters'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),

  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'resolved', 'closed'])
    .withMessage('Status must be one of: open, in_progress, resolved, closed'),

  body('category')
    .optional()
    .isIn(['general', 'bug', 'feature_request', 'technical_support'])
    .withMessage('Category must be one of: general, bug, feature_request, technical_support'),

  body('assigned_to')
    .optional()
    .isInt({ min: 1 })
    .withMessage('assigned_to must be a valid user ID'),

  body('resolution')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Resolution must be less than 1000 characters'),
];

// CV batch name validation
const validateBatchCreation = [
  body('batchName')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Batch name must be between 3-100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Batch name can only contain letters, numbers, spaces, hyphens, and underscores'),
];

// Pagination validation
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
];

// ID parameter validation
const validateId = [param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer')];

const validateUUID = [param('id').isUUID().withMessage('ID must be a valid UUID')];

// Timeframe validation
const validateTimeframe = [
  query('timeframe')
    .optional()
    .isIn(['7d', '30d', '90d', '1y'])
    .withMessage('Timeframe must be one of: 7d, 30d, 90d, 1y'),
];

// User preferences validation
const validateUserPreferences = [
  body('theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be either light or dark'),

  body('notifications_email')
    .optional()
    .isBoolean()
    .withMessage('notifications_email must be a boolean'),

  body('notifications_browser')
    .optional()
    .isBoolean()
    .withMessage('notifications_browser must be a boolean'),

  body('language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language must be a valid language code'),

  body('timezone')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Timezone must be a valid timezone string'),
];

// Search validation
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1-100 characters'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1-100 characters'),
];

// Status validation
const validateStatus = [
  query('status')
    .optional()
    .isIn([
      'active',
      'inactive',
      'pending',
      'completed',
      'failed',
      'processing',
      'open',
      'in_progress',
      'resolved',
      'closed',
    ])
    .withMessage('Invalid status value'),
];

// Sort validation
const validateSort = [
  query('sort_by')
    .optional()
    .isIn(['created_at', 'updated_at', 'name', 'email', 'score', 'priority', 'status'])
    .withMessage('Invalid sort field'),

  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

// Export format validation
const validateExportFormat = [
  query('format').optional().isIn(['json', 'csv']).withMessage('Export format must be json or csv'),
];

// Date range validation
const validateDateRange = [
  query('start_date').optional().isISO8601().withMessage('Start date must be a valid ISO date'),

  query('end_date').optional().isISO8601().withMessage('End date must be a valid ISO date'),
];

// Role validation
const validateRole = [
  query('role')
    .optional()
    .isIn(['user', 'admin', 'superadmin'])
    .withMessage('Role must be one of: user, admin, superadmin'),

  body('role')
    .optional()
    .isIn(['user', 'admin', 'superadmin'])
    .withMessage('Role must be one of: user, admin, superadmin'),
];

// User creation validation (admin)
const validateUserCreation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),

  body('first_name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be between 1-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),

  body('last_name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be between 1-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),

  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),

  body('job_title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Job title must be less than 100 characters'),

  body('send_invitation').optional().isBoolean().withMessage('send_invitation must be a boolean'),
];

// Batch ID validation
const validateBatchId = [param('batch_id').isUUID().withMessage('Batch ID must be a valid UUID')];

// Candidate ID validation
const validateCandidateId = [
  param('candidate_id').isUUID().withMessage('Candidate ID must be a valid UUID'),
];

// Ticket ID validation
const validateTicketId = [
  param('ticket_id').isInt({ min: 1 }).withMessage('Ticket ID must be a positive integer'),
];

// User ID validation
const validateUserId = [
  param('user_id').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
];

// Agent ID validation
const validateAgentId = [
  query('agent_id').optional().isAlphanumeric().withMessage('Agent ID must be alphanumeric'),

  param('agent_id').optional().isAlphanumeric().withMessage('Agent ID must be alphanumeric'),
];

// Priority validation
const validatePriority = [
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
];

// Category validation
const validateCategory = [
  query('category')
    .optional()
    .isIn(['general', 'bug', 'feature_request', 'technical_support'])
    .withMessage('Category must be one of: general, bug, feature_request, technical_support'),
];

// Password change validation
const validatePasswordChange = [
  body('current_password').notEmpty().withMessage('Current password is required'),

  body('new_password')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    ),

  body('confirm_password').custom((value, { req }) => {
    if (value !== req.body.new_password) {
      throw new Error('Password confirmation does not match new password');
    }
    return true;
  }),
];

// Email validation
const validateEmailOnly = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
];

// Password reset confirmation validation
const validatePasswordResetConfirm = [
  body('token').notEmpty().withMessage('Reset token is required'),

  body('new_password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    ),

  body('confirm_password').custom((value, { req }) => {
    if (value !== req.body.new_password) {
      throw new Error('Password confirmation does not match new password');
    }
    return true;
  }),
];

module.exports = {
  validateLogin,
  validateRegistration,
  validatePasswordReset,
  validatePasswordResetConfirm,
  validateProfileUpdate,
  validateNotificationId,
  validateTicketCreation,
  validateTicketComment,
  validateTicketUpdate,
  validateTicketId,
  validatePagination,
  validateStatus,
  validateCandidateId,
  validateUserId,
  validateAgentId,
  validatePriority,
  validateCategory,
  validatePasswordChange,
  validateEmailOnly,
  validateBatchCreation,
  validateBatchId,
  validateExportFormat,
  validateTimeframe,
  validateEmailVerification,
  validatePasswordResetRequest,
  validateSearch,
  validateSort,
  validateUserCreation,
  validateRole,
  validateDateRange,
  validateUserPreferences,
  validateUUID,
  validateId,
};
