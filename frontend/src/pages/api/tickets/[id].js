/**
 * Ticket Detail API Route (Get, Update, Delete)
 * GET    /api/tickets/[id] - Get ticket details with comments
 * PATCH  /api/tickets/[id] - Update ticket
 * DELETE /api/tickets/[id] - Delete ticket
 */

import { prisma } from '../../../lib/prisma';
import { withAuth } from '../../../lib/api-auth';

async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      return await getTicket(req, res);
    } else if (method === 'PATCH') {
      return await updateTicket(req, res);
    } else if (method === 'DELETE') {
      return await deleteTicket(req, res);
    } else {
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`,
      });
    }
  } catch (error) {
    console.error('Ticket detail API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * GET /api/tickets/[id]
 * Get ticket details with all comments
 */
async function getTicket(req, res) {
  const { user } = req;
  const { id } = req.query;

  const ticketId = parseInt(id);

  if (isNaN(ticketId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ticket ID',
    });
  }

  // Fetch ticket with comments in a transaction for consistency
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

  // Transform response to match old API format
  return res.status(200).json({
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
}

/**
 * PATCH /api/tickets/[id]
 * Update ticket (status, priority, or category)
 */
async function updateTicket(req, res) {
  const { user } = req;
  const { id } = req.query;
  const { status, priority, category } = req.body;

  const ticketId = parseInt(id);

  if (isNaN(ticketId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ticket ID',
    });
  }

  // Validation
  if (status && !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status. Must be: open, in_progress, resolved, or closed',
    });
  }

  if (priority && !['low', 'medium', 'high', 'urgent'].includes(priority)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid priority. Must be: low, medium, high, or urgent',
    });
  }

  // Build update data
  const updateData = {};
  if (status !== undefined) updateData.status = status;
  if (priority !== undefined) updateData.priority = priority;
  if (category !== undefined) updateData.category = category ? category.trim() : null;

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No update data provided',
    });
  }

  // Update with authorization check in transaction
  const result = await prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return null;
    }

    // Check if user owns the ticket or is admin/support
    if (ticket.user_id !== user.id && !['admin', 'support'].includes(user.role)) {
      return { forbidden: true };
    }

    // Update the ticket
    const updated = await tx.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
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

    return updated;
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
      error: 'You do not have permission to update this ticket',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Ticket updated successfully',
    data: {
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
  });
}

/**
 * DELETE /api/tickets/[id]
 * Delete ticket (admin/support only)
 */
async function deleteTicket(req, res) {
  const { user } = req;
  const { id } = req.query;

  const ticketId = parseInt(id);

  if (isNaN(ticketId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ticket ID',
    });
  }

  // Only admin/support can delete tickets
  if (!['admin', 'support'].includes(user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Only administrators and support staff can delete tickets',
    });
  }

  // Delete in transaction (will cascade delete comments)
  const result = await prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return null;
    }

    await tx.supportTicket.delete({
      where: { id: ticketId },
    });

    return ticket;
  });

  if (!result) {
    return res.status(404).json({
      success: false,
      error: 'Ticket not found',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Ticket deleted successfully',
  });
}

export default withAuth(handler);
