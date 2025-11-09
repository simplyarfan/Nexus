/**
 * Ticket Comments API Route
 * POST /api/tickets/[id]/comments - Add a comment to a ticket
 */

import { prisma } from '../../../../lib/prisma';
import { withAuth } from '../../../../lib/api-auth';

async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'POST') {
      return await addComment(req, res);
    } else {
      return res.status(405).json({
        success: false,
        error: `Method ${method} not allowed`,
      });
    }
  } catch (error) {
    console.error('Comments API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * POST /api/tickets/[id]/comments
 * Add a comment to a ticket
 *
 * This is the CRITICAL fix for the comment persistence issue.
 * Uses Prisma's $transaction to ensure:
 * 1. Comment is inserted
 * 2. Ticket's updated_at is updated
 * 3. Comment is fetched with user info
 * ALL IN THE SAME DATABASE TRANSACTION - guaranteeing read-after-write consistency
 */
async function addComment(req, res) {
  const { user } = req;
  const { id } = req.query;
  const { comment, is_internal = false } = req.body;

  const ticketId = parseInt(id);

  if (isNaN(ticketId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ticket ID',
    });
  }

  // Validation
  if (!comment || comment.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Comment cannot be empty',
    });
  }

  // Only admin/support can create internal comments
  const isInternalComment = is_internal && ['admin', 'support'].includes(user.role);

  // Use a transaction to ensure atomicity and read-after-write consistency
  const result = await prisma.$transaction(async (tx) => {
    // 1. Verify ticket exists and user has access
    const ticket = await tx.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return { notFound: true };
    }

    // Check if user owns the ticket or is admin/support
    if (ticket.user_id !== user.id && !['admin', 'support'].includes(user.role)) {
      return { forbidden: true };
    }

    // 2. Create the comment
    const newComment = await tx.ticketComment.create({
      data: {
        ticket_id: ticketId,
        user_id: user.id,
        comment: comment.trim(),
        is_internal: isInternalComment,
      },
    });

    // 3. Update the ticket's updated_at timestamp
    await tx.supportTicket.update({
      where: { id: ticketId },
      data: {
        updated_at: new Date(),
      },
    });

    // 4. Fetch the comment with user information
    // This ensures we return the exact same data that will be fetched later
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

  // Transform response to match old API format
  return res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: {
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
  });
}

export default withAuth(handler);
