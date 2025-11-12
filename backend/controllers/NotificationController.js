const database = require('../models/database');

class NotificationController {
  // Get user notifications
  static async getUserNotifications(req, res) {
    try {
      const { page = 1, limit = 20, unread_only = false, types } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          n.*,
          CASE 
            WHEN n.type = 'ticket_response' THEN 
              json_build_object(
                'ticket_id', st.id,
                'ticket_subject', st.subject,
                'responder_name', u.first_name || ' ' || u.last_name
              )
            ELSE n.metadata
          END as enriched_metadata
        FROM notifications n
        LEFT JOIN support_tickets st ON n.type = 'ticket_response' AND (n.metadata->>'ticket_id')::int = st.id
        LEFT JOIN users u ON n.type = 'ticket_response' AND (n.metadata->>'responder_id')::int = u.id
        WHERE n.user_id = $1
      `;

      const params = [req.user.id];

      // Filter by notification types if provided
      if (types) {
        const typeArray = Array.isArray(types) ? types : types.split(',');
        query += ` AND n.type = ANY($${params.length + 1})`;
        params.push(typeArray);
      }

      if (unread_only === 'true') {
        query += ' AND n.is_read = false';
      }

      query += `
        ORDER BY n.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      params.push(limit, offset);

      const notifications = await database.all(query, params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = $1';
      const countParams = [req.user.id];

      // Apply same type filter to count query
      if (types) {
        const typeArray = Array.isArray(types) ? types : types.split(',');
        countQuery += ` AND type = ANY($${countParams.length + 1})`;
        countParams.push(typeArray);
      }

      if (unread_only === 'true') {
        countQuery += ' AND is_read = false';
      }

      const totalCount = await database.get(countQuery, countParams);

      res.json({
        success: true,
        data: {
          notifications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount.total,
            totalPages: Math.ceil(totalCount.total / limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Mark notification as read
  static async markAsRead(req, res) {
    try {
      const { notification_id } = req.params;

      // Check if notification exists and belongs to user
      const notification = await database.get(
        `
        SELECT * FROM notifications WHERE id = $1 AND user_id = $2
      `,
        [notification_id, req.user.id],
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }

      // Mark as read
      await database.run(
        `
        UPDATE notifications 
        SET is_read = true, read_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `,
        [notification_id],
      );

      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(req, res) {
    try {
      await database.run(
        `
        UPDATE notifications 
        SET is_read = true, read_at = CURRENT_TIMESTAMP 
        WHERE user_id = $1 AND is_read = false
      `,
        [req.user.id],
      );

      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get unread notification count
  static async getUnreadCount(req, res) {
    try {
      const { types } = req.query;

      let query = `
        SELECT COUNT(*) as count FROM notifications 
        WHERE user_id = $1 AND is_read = false
      `;
      const params = [req.user.id];

      // Filter by notification types if provided
      if (types) {
        const typeArray = Array.isArray(types) ? types : types.split(',');
        query += ` AND type = ANY($${params.length + 1})`;
        params.push(typeArray);
      }

      const result = await database.get(query, params);

      res.json({
        success: true,
        data: {
          unread_count: result.count || 0,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Create notification (internal use)
  static async createNotification(userId, type, title, message, metadata = {}) {
    const result = await database.run(
      `
      INSERT INTO notifications (user_id, type, title, message, metadata)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `,
      [userId, type, title, message, JSON.stringify(metadata)],
    );

    return result.rows?.[0]?.id || result.id;
  }

  // Create ticket response notification
  static async createTicketResponseNotification(ticketId, responderId, message) {
    // Get ticket details
    const ticket = await database.get(
      `
      SELECT st.*, u.first_name, u.last_name
      FROM support_tickets st
      JOIN users u ON st.user_id = u.id
      WHERE st.id = $1
    `,
      [ticketId],
    );

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Get responder details
    const responder = await database.get(
      `
      SELECT first_name, last_name FROM users WHERE id = $1
    `,
      [responderId],
    );

    if (!responder) {
      throw new Error('Responder not found');
    }

    const title = `Response to your ticket: ${ticket.subject}`;
    const notificationMessage = `${responder.first_name} ${responder.last_name} responded to your support ticket.`;

    const metadata = {
      ticket_id: ticketId,
      responder_id: responderId,
      response_message: message,
      ticket_subject: ticket.subject,
    };

    return await this.createNotification(
      ticket.user_id,
      'ticket_response',
      title,
      notificationMessage,
      metadata,
    );
  }

  // Create ticket status change notification
  static async createTicketStatusNotification(ticketId, newStatus, updatedBy) {
    // Get ticket details
    const ticket = await database.get(
      `
      SELECT st.*, u.first_name, u.last_name
      FROM support_tickets st
      JOIN users u ON st.user_id = u.id
      WHERE st.id = $1
    `,
      [ticketId],
    );

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Get updater details
    const _updater = await database.get(
      `
      SELECT first_name, last_name FROM users WHERE id = $1
    `,
      [updatedBy],
    );

    const statusMessages = {
      open: 'reopened',
      in_progress: 'is now being worked on',
      resolved: 'has been resolved',
      closed: 'has been closed',
    };

    const title = `Ticket Status Update: ${ticket.subject}`;
    const notificationMessage = `Your support ticket ${statusMessages[newStatus] || `status changed to ${newStatus}`}.`;

    const metadata = {
      ticket_id: ticketId,
      old_status: ticket.status,
      new_status: newStatus,
      updated_by: updatedBy,
      ticket_subject: ticket.subject,
    };

    return await this.createNotification(
      ticket.user_id,
      'ticket_status_change',
      title,
      notificationMessage,
      metadata,
    );
  }

  // Delete notification
  static async deleteNotification(req, res) {
    try {
      const { notification_id } = req.params;

      // Check if notification exists and belongs to user
      const notification = await database.get(
        `
        SELECT * FROM notifications WHERE id = $1 AND user_id = $2
      `,
        [notification_id, req.user.id],
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
      }

      // Delete notification
      await database.run('DELETE FROM notifications WHERE id = $1', [notification_id]);

      res.json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

module.exports = NotificationController;
