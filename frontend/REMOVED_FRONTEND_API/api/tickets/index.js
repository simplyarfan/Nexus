/**
 * Tickets API Route (List & Create)
 * GET  /api/tickets - List all tickets for the authenticated user
 * POST /api/tickets - Create a new ticket
 */

import { prisma } from '../../../lib/prisma';
import { withAuth } from '../../../lib/api-auth';

async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      return await listTickets(req, res);
    } else if (method === 'POST') {
      return await createTicket(req, res);
    } else {
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`,
      });
    }
  } catch (error) {
    console.error('Tickets API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * GET /api/tickets
 * List all tickets for the authenticated user
 */
async function listTickets(req, res) {
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

  // Transform response to match old API format
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

  return res.status(200).json({
    success: true,
    data: transformedTickets,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
}

/**
 * POST /api/tickets
 * Create a new ticket
 */
async function createTicket(req, res) {
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

  // Create ticket with transaction to ensure atomicity
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

  return res.status(201).json({
    success: true,
    message: 'Ticket created successfully',
    data: {
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
  });
}

export default withAuth(handler);
