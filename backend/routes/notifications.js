const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const { authenticateToken, trackActivity } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiting');
const { validatePagination, validateNotificationId } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Get user notifications
router.get(
  '/',
  generalLimiter,
  validatePagination,
  trackActivity('notifications_viewed'),
  NotificationController.getUserNotifications,
);

// Get unread notification count
router.get(
  '/unread-count',
  generalLimiter,
  trackActivity('unread_count_checked'),
  NotificationController.getUnreadCount,
);

// Mark notification as read
router.put(
  '/:notification_id/read',
  generalLimiter,
  validateNotificationId,
  trackActivity('notification_marked_read'),
  NotificationController.markAsRead,
);

// Mark all notifications as read
router.put(
  '/mark-all-read',
  generalLimiter,
  trackActivity('all_notifications_marked_read'),
  NotificationController.markAllAsRead,
);

// Delete notification
router.delete(
  '/:notification_id',
  generalLimiter,
  validateNotificationId,
  trackActivity('notification_deleted'),
  NotificationController.deleteNotification,
);

module.exports = router;
