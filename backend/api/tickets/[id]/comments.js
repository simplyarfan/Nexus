/**
 * /api/tickets/[id]/comments
 * POST - Add comment to a ticket
 */

const { withProtectedRoute } = require('../../../middleware/serverless');
const { addTicketComment } = require('../../../services/tickets.service');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const { id } = req.query; // Ticket ID from route
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { comment, is_internal } = req.body;

    const result = await addTicketComment(id, userId, userRole, { comment, is_internal });

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment: result },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: 'Failed to add comment',
      message: error.message,
    });
  }
}

module.exports = withProtectedRoute(handler);
