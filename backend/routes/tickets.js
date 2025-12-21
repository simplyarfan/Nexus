const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');
const { sanitizeFields, sanitizeStrict, sanitizeRich } = require('../utils/sanitize');
const database = require('../models/database');

// Helper function to create notifications for all admins/superadmins
async function notifyAdmins(type, title, message, metadata = {}) {
  try {
    // Get all admin and superadmin users
    const admins = await database.all(
      `SELECT id FROM users WHERE role IN ('admin', 'superadmin')`,
      [],
    );

    // Create notification for each admin
    for (const admin of admins) {
      await database.run(
        `INSERT INTO notifications (user_id, type, title, message, metadata) VALUES ($1, $2, $3, $4, $5)`,
        [admin.id, type, title, message, JSON.stringify(metadata)],
      );
    }
  } catch (error) {
    console.error('Error creating admin notifications:', error);
  }
}

// Helper function to create notification for a specific user
async function notifyUser(userId, type, title, message, metadata = {}) {
  try {
    await database.run(
      `INSERT INTO notifications (user_id, type, title, message, metadata) VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, message, JSON.stringify(metadata)],
    );
  } catch (error) {
    console.error('Error creating user notification:', error);
  }
}

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     tags: [Support Tickets]
 *     summary: Get all support tickets
 *     description: Retrieve paginated list of support tickets for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *         description: Filter by ticket status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Tickets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tickets:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Ticket'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { user } = req;
    const { status, priority, page = 1, limit = 50 } = req.query;

    // Build filter - admin/superadmin see all tickets, users see only their own
    const where = {};

    if (!['admin', 'superadmin'].includes(user.role)) {
      where.user_id = user.id;
    }

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
      prisma.support_tickets.findMany({
        where,
        include: {
          users_support_tickets_user_idTousers: {
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
              ticket_comments: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take,
      }),
      prisma.support_tickets.count({ where }),
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
      user: ticket.users_support_tickets_user_idTousers,
      comment_count: ticket._count.ticket_comments,
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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tickets',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     tags: [Support Tickets]
 *     summary: Create new support ticket
 *     description: Create a new support ticket with subject, description, and priority
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - description
 *             properties:
 *               subject:
 *                 type: string
 *                 example: Unable to upload CV files
 *               description:
 *                 type: string
 *                 example: I'm getting an error when trying to upload PDF files larger than 5MB
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *                 example: high
 *               category:
 *                 type: string
 *                 example: Technical Issue
 *     responses:
 *       201:
 *         description: Ticket created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       $ref: '#/components/schemas/Ticket'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  '/',
  authenticateToken,
  sanitizeFields(['subject', 'category'], sanitizeStrict), // Strict for titles
  async (req, res) => {
    try {
      const { user } = req;
      let { subject, description, priority = 'medium', category } = req.body;

      // SECURITY: Sanitize description with rich formatting (allows safe HTML)
      description = sanitizeRich(description);

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
        const newTicket = await tx.support_tickets.create({
          data: {
            user_id: user.id,
            subject: subject.trim(),
            description: description.trim(),
            priority,
            category: category ? category.trim() : null,
            status: 'open',
          },
          include: {
            users_support_tickets_user_idTousers: {
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

      // Notify all admins about new ticket (if user is not admin)
      if (!['admin', 'superadmin'].includes(user.role)) {
        await notifyAdmins(
          'ticket_created',
          `New Ticket: ${subject}`,
          `${user.first_name} ${user.last_name} created a new ${priority} priority ticket.`,
          {
            ticket_id: ticket.id,
            user_id: user.id,
            priority: priority,
            category: category || null,
          },
        );
      }

      res.status(201).json({
        success: true,
        message: 'Ticket created successfully',
        data: {
          ticket: ticket,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create ticket',
        message: error.message,
      });
    }
  },
);

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     tags: [Support Tickets]
 *     summary: Get ticket details
 *     description: Retrieve detailed information about a specific ticket including all comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Ticket details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       $ref: '#/components/schemas/Ticket'
 *                     comments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TicketComment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Ticket not found
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
      const ticket = await tx.support_tickets.findUnique({
        where: { id: ticketId },
        include: {
          users_support_tickets_user_idTousers: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              role: true,
            },
          },
          ticket_comments: {
            include: {
              users: {
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

      // Check if user owns the ticket or is admin/superadmin
      if (ticket.user_id !== user.id && !['admin', 'superadmin'].includes(user.role)) {
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
          user: result.users_support_tickets_user_idTousers,
        },
        comments: result.ticket_comments.map((comment) => ({
          id: comment.id,
          ticket_id: comment.ticket_id,
          user_id: comment.user_id,
          comment: comment.comment,
          is_internal: comment.is_internal,
          created_at: comment.created_at,
          first_name: comment.users.first_name,
          last_name: comment.users.last_name,
          email: comment.users.email,
          role: comment.users.role,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/tickets/{id}/comments:
 *   post:
 *     tags: [Support Tickets]
 *     summary: Add comment to ticket
 *     description: Add a new comment to an existing support ticket
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ticket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comment
 *             properties:
 *               comment:
 *                 type: string
 *                 example: I've tried using smaller files and it works. The issue only occurs with files larger than 5MB.
 *               is_internal:
 *                 type: boolean
 *                 default: false
 *                 description: Internal comments are only visible to admin/support (requires admin/support role)
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     comment:
 *                       $ref: '#/components/schemas/TicketComment'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Ticket not found
 */
router.post(
  '/:id/comments',
  authenticateToken,
  sanitizeFields(['comment'], sanitizeRich), // Allow safe formatting in comments
  async (req, res) => {
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

      // Only admin/superadmin can create internal comments
      const isInternalComment = is_internal && ['admin', 'superadmin'].includes(user.role);

      // Use transaction for atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Verify ticket exists and user has access
        const ticket = await tx.support_tickets.findUnique({
          where: { id: ticketId },
        });

        if (!ticket) {
          return { notFound: true };
        }

        if (ticket.user_id !== user.id && !['admin', 'superadmin'].includes(user.role)) {
          return { forbidden: true };
        }

        // Create comment
        const newComment = await tx.ticket_comments.create({
          data: {
            ticket_id: ticketId,
            user_id: user.id,
            comment: comment.trim(),
            is_internal: isInternalComment,
          },
        });

        // Update ticket timestamp
        await tx.support_tickets.update({
          where: { id: ticketId },
          data: {
            updated_at: new Date(),
          },
        });

        // Fetch comment with user info
        const commentWithUser = await tx.ticket_comments.findUnique({
          where: { id: newComment.id },
          include: {
            users: {
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

      // Create notifications based on who commented
      const ticket = await prisma.support_tickets.findUnique({
        where: { id: ticketId },
        include: {
          users_support_tickets_user_idTousers: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      if (ticket) {
        // If admin/superadmin commented, notify the ticket owner
        if (['admin', 'superadmin'].includes(user.role) && ticket.user_id !== user.id) {
          await notifyUser(
            ticket.user_id,
            'ticket_comment',
            `New Comment on Ticket: ${ticket.subject}`,
            `${user.first_name} ${user.last_name} commented on your ticket.`,
            {
              ticket_id: ticketId,
              commenter_id: user.id,
              commenter_role: user.role,
            },
          );
        }
        // If regular user commented on their own ticket, notify all admins
        else if (!['admin', 'superadmin'].includes(user.role)) {
          await notifyAdmins(
            'ticket_comment',
            `New Comment on Ticket: ${ticket.subject}`,
            `${user.first_name} ${user.last_name} added a comment to their ticket.`,
            {
              ticket_id: ticketId,
              user_id: user.id,
            },
          );
        }
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
            first_name: result.users.first_name,
            last_name: result.users.last_name,
            email: result.users.email,
            role: result.users.role,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to add comment',
        message: error.message,
      });
    }
  },
);

/**
 * @swagger
 * /api/tickets/{id}/resolve:
 *   patch:
 *     tags: [Support Tickets]
 *     summary: Resolve ticket
 *     description: Mark ticket as resolved (admin/superadmin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ticket ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolution:
 *                 type: string
 *                 description: Resolution notes
 *     responses:
 *       200:
 *         description: Ticket resolved successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Ticket not found
 */
router.patch('/:id/resolve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { resolution } = req.body;

    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticket ID',
      });
    }

    const ticket = await prisma.support_tickets.update({
      where: { id: ticketId },
      data: {
        status: 'resolved',
        resolution: resolution || null,
        resolved_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Ticket resolved successfully',
      data: { ticket },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to resolve ticket',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/tickets/{id}/status:
 *   patch:
 *     tags: [Support Tickets]
 *     summary: Update ticket status
 *     description: Update ticket status (admin/superadmin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ticket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Ticket not found
 */
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ticket ID',
      });
    }

    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: open, in_progress, resolved, or closed',
      });
    }

    // Get current ticket to check old status
    const currentTicket = await prisma.support_tickets.findUnique({
      where: { id: ticketId },
    });

    if (!currentTicket) {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }

    const oldStatus = currentTicket.status;

    const updateData = {
      status,
      updated_at: new Date(),
    };

    // If resolving, set resolved_at
    if (status === 'resolved') {
      updateData.resolved_at = new Date();
    }

    const ticket = await prisma.support_tickets.update({
      where: { id: ticketId },
      data: updateData,
    });

    // Create a system comment for status change
    if (oldStatus !== status) {
      const statusLabels = {
        open: 'Open',
        in_progress: 'In Progress',
        resolved: 'Resolved',
        closed: 'Closed',
      };

      await prisma.ticket_comments.create({
        data: {
          ticket_id: ticketId,
          user_id: req.user.id,
          comment: `Status changed from ${statusLabels[oldStatus]} to ${statusLabels[status]}`,
          is_internal: false,
        },
      });

      // Notify ticket owner about status change (if they're not the one changing it)
      if (currentTicket.user_id !== req.user.id) {
        const ticketWithUser = await prisma.support_tickets.findUnique({
          where: { id: ticketId },
        });

        await notifyUser(
          currentTicket.user_id,
          'ticket_status_change',
          `Ticket Status Updated: ${currentTicket.subject}`,
          `Your ticket status changed from ${statusLabels[oldStatus]} to ${statusLabels[status]}.`,
          {
            ticket_id: ticketId,
            old_status: oldStatus,
            new_status: status,
            updated_by: req.user.id,
          },
        );
      }
    }

    res.json({
      success: true,
      message: 'Ticket status updated successfully',
      data: { ticket },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Ticket not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update ticket status',
      message: error.message,
    });
  }
});

module.exports = router;
