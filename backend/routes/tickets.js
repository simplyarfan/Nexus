const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/tickets
 * List all tickets for the authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const { status, priority, page = 1, limit = 50 } = req.query;

    // Build filter
    const where = {
      user_id: user.id,
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Fetch tickets with user information and comment count
    const [tickets, total] = await prisma.$transaction([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              role: true,
            },
          },
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    // Transform response
    const transformedTickets = tickets.map((ticket) => ({
      id: ticket.id,
      user_id: ticket.user_id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      user: ticket.user,
      comment_count: ticket._count.comments,
    }));

    res.json({
      success: true,
      data: {
        tickets: transformedTickets,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tickets',
      message: error.message,
    });
  }
});

/**
 * POST /api/tickets
 * Create a new ticket
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const { subject, description, priority = 'medium', category } = req.body;

    // Validation
    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        error: 'Subject and description are required',
      });
    }

    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid priority. Must be: low, medium, high, or urgent',
      });
    }

    // Create ticket with transaction
    const ticket = await prisma.$transaction(async (tx) => {
      const newTicket = await tx.supportTicket.create({
        data: {
          user_id: user.id,
          subject: subject.trim(),
          description: description.trim(),
          priority,
          category: category ? category.trim() : null,
          status: 'open',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              role: true,
            },
          },
        },
      });

      return newTicket;
    });

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: {
        ticket: ticket,
      },
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create ticket',
      message: error.message,
    });
  }
});

/**
 * GET /api/tickets/:id
 * Get ticket details with all comments
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const ticketId = parseInt(req.params.id);

    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticket ID',
      });
    }

    // Fetch ticket with comments in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              role: true,
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  last_name: true,
                  role: true,
                },
              },
            },
            orderBy: {
              created_at: 'asc',
            },
          },
        },
      });

      if (!ticket) {
        return null;
      }

      // Check if user owns the ticket or is admin/support
      if (ticket.user_id !== user.id && !['admin', 'support'].includes(user.role)) {
        return { forbidden: true };
      }

      return ticket;
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

    if (result.forbidden) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this ticket',
      });
    }

    // Transform response
    res.json({
      success: true,
      data: {
        ticket: {
          id: result.id,
          user_id: result.user_id,
          subject: result.subject,
          description: result.description,
          status: result.status,
          priority: result.priority,
          category: result.category,
          created_at: result.created_at,
          updated_at: result.updated_at,
          user: result.user,
        },
        comments: result.comments.map((comment) => ({
          id: comment.id,
          ticket_id: comment.ticket_id,
          user_id: comment.user_id,
          comment: comment.comment,
          is_internal: comment.is_internal,
          created_at: comment.created_at,
          first_name: comment.user.first_name,
          last_name: comment.user.last_name,
          email: comment.user.email,
          role: comment.user.role,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket',
      message: error.message,
    });
  }
});

/**
 * POST /api/tickets/:id/comments
 * Add a comment to a ticket
 */
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const ticketId = parseInt(req.params.id);
    const { comment, is_internal = false } = req.body;

    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticket ID',
      });
    }

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment cannot be empty',
      });
    }

    // Only admin/support can create internal comments
    const isInternalComment = is_internal && ['admin', 'support'].includes(user.role);

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Verify ticket exists and user has access
      const ticket = await tx.supportTicket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        return { notFound: true };
      }

      if (ticket.user_id !== user.id && !['admin', 'support'].includes(user.role)) {
        return { forbidden: true };
      }

      // Create comment
      const newComment = await tx.ticketComment.create({
        data: {
          ticket_id: ticketId,
          user_id: user.id,
          comment: comment.trim(),
          is_internal: isInternalComment,
        },
      });

      // Update ticket timestamp
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          updated_at: new Date(),
        },
      });

      // Fetch comment with user info
      const commentWithUser = await tx.ticketComment.findUnique({
        where: { id: newComment.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              role: true,
            },
          },
        },
      });

      return commentWithUser;
    });

    if (result.notFound) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

    if (result.forbidden) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to comment on this ticket',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: {
          id: result.id,
          ticket_id: result.ticket_id,
          user_id: result.user_id,
          comment: result.comment,
          is_internal: result.is_internal,
          created_at: result.created_at,
          first_name: result.user.first_name,
          last_name: result.user.last_name,
          email: result.user.email,
          role: result.user.role,
        },
      },
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment',
      message: error.message,
    });
  }
});

module.exports = router;
