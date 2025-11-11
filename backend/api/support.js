/**
 * Support Ticket API Endpoint
 * Handles support ticket creation, updates, and retrieval
 */

const { withProtectedRoute } = require('../middleware/serverless');
const { prisma } = require('../lib/prisma');

async function handler(req, res) {
  const { method } = req;
  const userId = req.user.userId;
  const path = req.url.replace('/api/support', '').split('?')[0];

  // GET /api/support - Get all tickets
  if (path === '' && method === 'GET') {
    try {
      const tickets = await prisma.supportTicket.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          subject: true,
          description: true,
          status: true,
          priority: true,
          created_at: true,
          updated_at: true,
        },
      });

      return res.status(200).json({
        success: true,
        tickets,
      });
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch support tickets',
      });
    }
  }

  // POST /api/support - Create ticket
  if (path === '' && method === 'POST') {
    try {
      const { subject, description, priority = 'medium' } = req.body;

      if (!subject || !description) {
        return res.status(400).json({
          success: false,
          message: 'Subject and description are required',
        });
      }

      const ticket = await prisma.supportTicket.create({
        data: {
          user_id: userId,
          subject,
          description,
          priority,
          status: 'open',
        },
        select: {
          id: true,
          subject: true,
          description: true,
          status: true,
          priority: true,
          created_at: true,
        },
      });

      return res.status(201).json({
        success: true,
        ticket,
        message: 'Support ticket created successfully',
      });
    } catch (error) {
      console.error('Error creating support ticket:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create support ticket',
      });
    }
  }

  // PATCH /api/support/:ticketId - Update ticket
  const ticketIdMatch = path.match(/^\/(\d+)/);
  if (ticketIdMatch && method === 'PATCH') {
    try {
      const ticketId = parseInt(ticketIdMatch[1]);
      const { status } = req.body;

      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value',
        });
      }

      const ticket = await prisma.supportTicket.updateMany({
        where: {
          id: ticketId,
          user_id: userId,
        },
        data: {
          status,
          updated_at: new Date(),
        },
      });

      if (ticket.count === 0) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found or unauthorized',
        });
      }

      const updatedTicket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          subject: true,
          status: true,
          updated_at: true,
        },
      });

      return res.status(200).json({
        success: true,
        ticket: updatedTicket,
        message: 'Ticket updated successfully',
      });
    } catch (error) {
      console.error('Error updating support ticket:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update support ticket',
      });
    }
  }

  return res.status(404).json({
    success: false,
    message: `Route not found: ${method} ${path}`,
  });
}

module.exports = withProtectedRoute(handler);
