/**
 * Tickets Service
 * Business logic for support tickets system
 */

const { prisma } = require('../lib/prisma');

/**
 * Get all tickets for a user (with filters)
 */
const getUserTickets = async (userId, { status, priority, page = 1, limit = 50 }) => {
  const where = { user_id: userId };

  if (status) where.status = status;
  if (priority) where.priority = priority;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

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

  return {
    tickets: tickets.map((ticket) => ({
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
    })),
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/**
 * Create a new ticket
 */
const createTicket = async (userId, { subject, description, priority = 'medium', category }) => {
  // Validation
  if (!subject || !description) {
    throw { statusCode: 400, message: 'Subject and description are required' };
  }

  if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
    throw { statusCode: 400, message: 'Invalid priority. Must be: low, medium, high, or urgent' };
  }

  const ticket = await prisma.$transaction(async (tx) => {
    const newTicket = await tx.supportTicket.create({
      data: {
        user_id: userId,
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

  return ticket;
};

/**
 * Get single ticket with comments
 */
const getTicketById = async (ticketId, userId, userRole) => {
  const ticket = await prisma.$transaction(async (tx) => {
    const foundTicket = await tx.supportTicket.findUnique({
      where: { id: parseInt(ticketId) },
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

    if (!foundTicket) {
      throw { statusCode: 404, message: 'Ticket not found' };
    }

    // Check permissions
    if (foundTicket.user_id !== userId && !['admin', 'superadmin', 'support'].includes(userRole)) {
      throw { statusCode: 403, message: 'You do not have permission to view this ticket' };
    }

    return foundTicket;
  });

  return {
    ticket: {
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
    },
    comments: ticket.comments.map((comment) => ({
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
  };
};

/**
 * Add comment to ticket
 */
const addTicketComment = async (ticketId, userId, userRole, { comment, is_internal = false }) => {
  if (!comment || comment.trim().length === 0) {
    throw { statusCode: 400, message: 'Comment cannot be empty' };
  }

  // Only admin/support can create internal comments
  const isInternalComment = is_internal && ['admin', 'superadmin', 'support'].includes(userRole);

  const result = await prisma.$transaction(async (tx) => {
    // Verify ticket exists and user has access
    const ticket = await tx.supportTicket.findUnique({
      where: { id: parseInt(ticketId) },
    });

    if (!ticket) {
      throw { statusCode: 404, message: 'Ticket not found' };
    }

    if (ticket.user_id !== userId && !['admin', 'superadmin', 'support'].includes(userRole)) {
      throw { statusCode: 403, message: 'You do not have permission to comment on this ticket' };
    }

    // Create comment
    const newComment = await tx.ticketComment.create({
      data: {
        ticket_id: parseInt(ticketId),
        user_id: userId,
        comment: comment.trim(),
        is_internal: isInternalComment,
      },
    });

    // Update ticket timestamp
    await tx.supportTicket.update({
      where: { id: parseInt(ticketId) },
      data: { updated_at: new Date() },
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

  return {
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
  };
};

module.exports = {
  getUserTickets,
  createTicket,
  getTicketById,
  addTicketComment,
};
