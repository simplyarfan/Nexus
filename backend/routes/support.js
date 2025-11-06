const express = require('express');
const router = express.Router();
const SupportController = require('../controllers/SupportController');
const { authenticateToken, requireAdmin, trackActivity } = require('../middleware/auth');
const { ticketLimiter, generalLimiter } = require('../middleware/rateLimiting');
const {
  validateTicketCreation,
  validateTicketComment,
  validateTicketUpdate,
  validateTicketId,
  validatePagination,
  validateStatus,
  validatePriority,
  validateCategory,
  validateTimeframe,
  validateSearch,
  validateSort,
} = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Debug route - Check database connection type
router.get('/debug/connection', generalLimiter, SupportController.checkDatabaseConnection);

// User routes (create and view own tickets)

// Create new support ticket
router.post(
  '/',
  ticketLimiter,
  validateTicketCreation,
  trackActivity('support_ticket_created'),
  SupportController.createTicket,
);

// Get user's tickets
router.get(
  '/my-tickets',
  generalLimiter,
  validatePagination,
  validateStatus,
  validatePriority,
  trackActivity('user_tickets_viewed'),
  SupportController.getUserTickets,
);

// Get specific ticket details
router.get(
  '/:ticket_id',
  generalLimiter,
  validateTicketId,
  trackActivity('ticket_details_viewed'),
  SupportController.getTicketDetails,
);

// Add comment to ticket
router.post(
  '/:ticket_id/comments',
  generalLimiter,
  validateTicketId,
  validateTicketComment,
  trackActivity('ticket_comment_added'),
  SupportController.addComment,
);

// Update ticket (user can update their own, admin can update any)
router.put(
  '/:ticket_id',
  generalLimiter,
  validateTicketId,
  validateTicketUpdate,
  trackActivity('ticket_updated'),
  SupportController.updateTicket,
);

// Admin routes (manage all tickets)

// Get all tickets (admin only)
router.get(
  '/admin/all',
  requireAdmin,
  generalLimiter,
  validatePagination,
  validateStatus,
  validatePriority,
  validateCategory,
  validateSearch,
  validateSort,
  trackActivity('all_tickets_viewed'),
  SupportController.getAllTickets,
);

// Get support statistics (admin only)
router.get(
  '/admin/stats',
  requireAdmin,
  generalLimiter,
  validateTimeframe,
  trackActivity('support_stats_viewed'),
  SupportController.getSupportStats,
);

// Delete ticket (admin only)
router.delete(
  '/:ticket_id',
  requireAdmin,
  validateTicketId,
  trackActivity('ticket_deleted'),
  SupportController.deleteTicket,
);

module.exports = router;
