/**
 * /api/tickets
 * GET - List all tickets for authenticated user
 * POST - Create a new ticket
 */

const { withProtectedRoute } = require('../../middleware/serverless');
const { getUserTickets, createTicket } = require('../../services/tickets.service');

async function handler(req, res) {
  const userId = req.user.userId;

  // GET - List tickets
  if (req.method === 'GET') {
    try {
      const { status, priority, page, limit } = req.query;
      const result = await getUserTickets(userId, { status, priority, page, limit });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: 'Failed to fetch tickets',
        message: error.message,
      });
    }
  }

  // POST - Create ticket
  if (req.method === 'POST') {
    try {
      const { subject, description, priority, category } = req.body;
      const ticket = await createTicket(userId, { subject, description, priority, category });

      return res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        data: { ticket },
      });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: 'Failed to create ticket',
        message: error.message,
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
  });
}

module.exports = withProtectedRoute(handler);
