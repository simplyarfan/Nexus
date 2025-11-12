/**
 * Consolidated Tickets Routes
 * GET/POST /api/tickets
 * GET/PATCH/DELETE /api/tickets/[id]
 * POST /api/tickets/[id]/comments
 */

const { withProtectedRoute } = require('../middleware/serverless');
const {
  getUserTickets,
  createTicket,
  getTicketById,
  updateTicket,
  deleteTicket,
  addComment,
} = require('../services/tickets.service');

async function handler(req, res) {
  const { method } = req;
  const userId = req.user.userId;
  const path = req.url.replace('/api/tickets', '').split('?')[0];

  // GET /api/tickets - List all tickets
  if (path === '' && method === 'GET') {
    try {
      const { status, priority, page, limit } = req.query;
      const result = await getUserTickets(userId, { status, priority, page, limit });
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res
        .status(statusCode)
        .json({ success: false, error: 'Failed to fetch tickets', message: error.message });
    }
  }

  // POST /api/tickets - Create ticket
  if (path === '' && method === 'POST') {
    try {
      const { subject, description, priority, category } = req.body;
      const ticket = await createTicket(userId, { subject, description, priority, category });
      return res
        .status(201)
        .json({ success: true, message: 'Ticket created successfully', data: { ticket } });
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res
        .status(statusCode)
        .json({ success: false, error: 'Failed to create ticket', message: error.message });
    }
  }

  // Routes with [id] param
  const idMatch = path.match(/^\/(\d+)/);
  if (idMatch) {
    const ticketId = parseInt(idMatch[1]);

    // GET /api/tickets/[id]
    if (path === `/${ticketId}` && method === 'GET') {
      try {
        const ticket = await getTicketById(ticketId, userId);
        return res.status(200).json({ success: true, data: { ticket } });
      } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, message: error.message });
      }
    }

    // PATCH /api/tickets/[id]
    if (path === `/${ticketId}` && method === 'PATCH') {
      try {
        const updates = req.body;
        const ticket = await updateTicket(ticketId, userId, updates);
        return res
          .status(200)
          .json({ success: true, message: 'Ticket updated successfully', data: { ticket } });
      } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, message: error.message });
      }
    }

    // DELETE /api/tickets/[id]
    if (path === `/${ticketId}` && method === 'DELETE') {
      try {
        await deleteTicket(ticketId, userId);
        return res.status(200).json({ success: true, message: 'Ticket deleted successfully' });
      } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, message: error.message });
      }
    }

    // POST /api/tickets/[id]/comments
    if (path === `/${ticketId}/comments` && method === 'POST') {
      try {
        const { comment, is_internal } = req.body;
        const newComment = await addComment(ticketId, userId, comment, is_internal);
        return res.status(201).json({
          success: true,
          message: 'Comment added successfully',
          data: { comment: newComment },
        });
      } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ success: false, message: error.message });
      }
    }
  }

  return res.status(404).json({ success: false, message: `Route not found: ${method} ${path}` });
}

module.exports = withProtectedRoute(handler);
