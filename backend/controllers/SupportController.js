const database = require('../models/database');
const { validationResult } = require('express-validator');

class SupportController {
  // Create new support ticket
  static async createTicket(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const { subject, description, priority = 'medium', category = 'general' } = req.body;

      // Create ticket
      const result = await database.run(
        `
        INSERT INTO support_tickets (user_id, subject, description, priority, category)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      `,
        [req.user.id, subject, description, priority, category],
      );

      // Get ticket ID from PostgreSQL result
      const ticketId = result.rows?.[0]?.id || result.id;

      // Get created ticket
      const ticket = await database.get(
        `
        SELECT 
          st.*,
          u.first_name,
          u.last_name,
          u.email
        FROM support_tickets st
        JOIN users u ON st.user_id = u.id
        WHERE st.id = $1
      `,
        [ticketId],
      );

      // Track ticket creation activity
      await database.run(
        `
        INSERT INTO user_analytics (user_id, action, metadata, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [
          req.user.id,
          'support_ticket_created',
          JSON.stringify({ ticket_id: ticketId, subject, priority, category }),
          req.ip,
          req.get('User-Agent'),
        ],
      );

      // Notify all admins and superadmins about new ticket
      try {
        const admins = await database.all(`
          SELECT id FROM users WHERE role IN ('admin', 'superadmin')
        `);

        const NotificationController = require('./NotificationController');
        for (const admin of admins) {
          await NotificationController.createNotification(
            admin.id,
            'new_ticket',
            `New Support Ticket: ${subject}`,
            `${ticket.first_name} ${ticket.last_name} created a new ${priority} priority ticket.`,
            {
              ticket_id: ticketId,
              user_id: req.user.id,
              subject,
              priority,
              category,
            },
          );
        }
      } catch (notifError) {
        console.error('Failed to create admin notifications:', notifError);
        // Don't fail the request if notifications fail
      }

      res.status(201).json({
        success: true,
        message: 'Support ticket created successfully',
        data: { ticket },
      });
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get user's tickets
  static async getUserTickets(req, res) {
    try {
      const { page = 1, limit = 20, status, priority } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          st.*,
          COALESCE(COUNT(tc.id), 0) as comment_count
        FROM support_tickets st
        LEFT JOIN ticket_comments tc ON st.id = tc.ticket_id
        WHERE st.user_id = $1
      `;

      const params = [req.user.id];

      if (status) {
        query += ` AND st.status = $${params.length + 1}`;
        params.push(status);
      }

      if (priority) {
        query += ` AND st.priority = $${params.length + 1}`;
        params.push(priority);
      }

      query += `
        GROUP BY st.id
        ORDER BY st.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      params.push(limit, offset);

      const tickets = await database.all(query, params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM support_tickets WHERE user_id = $1';
      const countParams = [req.user.id];

      if (status) {
        countQuery += ` AND status = $${countParams.length + 1}`;
        countParams.push(status);
      }

      if (priority) {
        countQuery += ` AND priority = $${countParams.length + 1}`;
        countParams.push(priority);
      }

      const totalCount = await database.get(countQuery, countParams);

      res.json({
        success: true,
        data: {
          tickets,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount.total,
            totalPages: Math.ceil(totalCount.total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Get user tickets error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Debug endpoint - Check database connection type
  static async checkDatabaseConnection(req, res) {
    try {
      const connectionString =
        process.env.POSTGRES_URL_NON_POOLING ||
        process.env.DATABASE_URL_UNPOOLED ||
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL;

      const isUnpooled =
        connectionString &&
        (connectionString.includes('UNPOOLED') ||
          connectionString.includes('NON_POOLING') ||
          connectionString.includes('pooler=false') ||
          !connectionString.includes('pooler'));

      const connectionType = isUnpooled ? 'UNPOOLED (direct)' : 'POOLED (pgBouncer)';

      const hasNeonOfficial = !!process.env.POSTGRES_URL_NON_POOLING;
      const hasUnpooled = !!process.env.DATABASE_URL_UNPOOLED;
      const hasPooled = !!process.env.DATABASE_URL;

      const usingVariable = hasNeonOfficial
        ? 'POSTGRES_URL_NON_POOLING (Neon official) ✅'
        : hasUnpooled
          ? 'DATABASE_URL_UNPOOLED ⚠️'
          : 'DATABASE_URL (pooled) ❌';

      res.json({
        success: true,
        data: {
          connectionType,
          usingVariable,
          environmentVariables: {
            POSTGRES_URL_NON_POOLING: hasNeonOfficial ? 'SET ✅' : 'NOT SET ❌',
            DATABASE_URL_UNPOOLED: hasUnpooled ? 'SET ✅' : 'NOT SET ❌',
            DATABASE_URL: hasPooled ? 'SET ✅' : 'NOT SET ❌',
          },
          usingUnpooled: hasNeonOfficial || hasUnpooled,
          message:
            hasNeonOfficial || hasUnpooled
              ? `✅ Backend is using ${usingVariable}`
              : '❌ Backend is using pooled connection - read-after-write issues expected',
        },
      });
    } catch (error) {
      console.error('Check database connection error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get ticket details with comments
  static async getTicketDetails(req, res) {
    try {
      const { ticket_id } = req.params;

      // Get ticket details
      const ticket = await database.get(
        `
        SELECT 
          st.*,
          u.first_name,
          u.last_name,
          u.email,
          assigned_user.first_name as assigned_first_name,
          assigned_user.last_name as assigned_last_name
        FROM support_tickets st
        JOIN users u ON st.user_id = u.id
        LEFT JOIN users assigned_user ON st.assigned_to = assigned_user.id
        WHERE st.id = $1
      `,
        [ticket_id],
      );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
      }

      // Check access permissions
      const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
      if (ticket.user_id !== req.user.id && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Get ticket comments
      const comments = await database.all(
        `
        SELECT 
          tc.*,
          u.first_name,
          u.last_name,
          u.email,
          u.role
        FROM ticket_comments tc
        LEFT JOIN users u ON tc.user_id = u.id
        WHERE tc.ticket_id = $1
        ORDER BY tc.created_at ASC
      `,
        [ticket_id],
      );

      res.json({
        success: true,
        data: {
          ticket,
          comments,
        },
      });
    } catch (error) {
      console.error('Get ticket details error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Add comment to ticket
  static async addComment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const { ticket_id } = req.params;
      const { comment, is_internal = false } = req.body;

      // Check if ticket exists and user has access
      const ticket = await database.get(
        `
        SELECT * FROM support_tickets WHERE id = $1
      `,
        [ticket_id],
      );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
      }

      // Check access permissions
      const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
      if (ticket.user_id !== req.user.id && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Only admins can add internal comments
      const isInternalComment = is_internal && isAdmin;

      // Get a client from the pool for transaction
      const client = await database.pool.connect();

      let commentId;
      let createdComment;

      try {
        // Start transaction with synchronous commit to force immediate persistence
        await client.query('BEGIN');
        await client.query('SET LOCAL synchronous_commit = on');

        // Add comment
        const result = await client.query(
          `
          INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal)
          VALUES ($1, $2, $3, $4) RETURNING id
        `,
          [ticket_id, req.user.id, comment, isInternalComment],
        );

        // Handle PostgreSQL result format
        commentId = result.rows?.[0]?.id;

        // Immediate validation - fail fast if no ID returned
        if (!commentId) {
          await client.query('ROLLBACK');
          console.error('🎫 [SUPPORT] Failed to create comment - no ID returned');
          return res.status(500).json({
            success: false,
            message: 'Failed to create comment - database error',
          });
        }

        // Update ticket's updated_at timestamp
        await client.query(
          `
          UPDATE support_tickets
          SET updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `,
          [ticket_id],
        );

        // Get the created comment with user info (in same transaction)
        const commentResult = await client.query(
          `
          SELECT
            tc.*,
            u.first_name,
            u.last_name,
            u.email,
            u.role
          FROM ticket_comments tc
          JOIN users u ON tc.user_id = u.id
          WHERE tc.id = $1
        `,
          [commentId],
        );

        createdComment = commentResult.rows[0];

        // Commit transaction and wait for WAL flush
        await client.query('COMMIT');

        // Force synchronous wait for write-ahead log flush
        await client.query('SELECT pg_current_wal_flush_lsn()');

        console.log('✅ [SUPPORT] Comment transaction committed and flushed:', commentId);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ [SUPPORT] Transaction failed:', error);
        throw error;
      } finally {
        client.release();
      }

      // Create notifications
      const NotificationController = require('./NotificationController');

      // If admin comments → notify ticket owner
      if (isAdmin && ticket.user_id !== req.user.id && !isInternalComment) {
        try {
          await NotificationController.createTicketResponseNotification(
            ticket_id,
            req.user.id,
            comment,
          );
        } catch (notifError) {
          console.error('Failed to notify ticket owner:', notifError);
        }
      }

      // If user comments → notify all admins
      if (!isAdmin) {
        try {
          const admins = await database.all(`
            SELECT id FROM users WHERE role IN ('admin', 'superadmin')
          `);

          const ticketDetails = await database.get(
            `
            SELECT subject FROM support_tickets WHERE id = $1
          `,
            [ticket_id],
          );

          for (const admin of admins) {
            await NotificationController.createNotification(
              admin.id,
              'ticket_comment',
              `New Comment on Ticket: ${ticketDetails.subject}`,
              `${createdComment.first_name} ${createdComment.last_name} added a comment to their support ticket.`,
              {
                ticket_id: parseInt(ticket_id),
                comment_id: commentId,
                user_id: req.user.id,
              },
            );
          }
        } catch (notifError) {
          console.error('Failed to notify admins:', notifError);
        }
      }

      // Track comment activity
      await database.run(
        `
        INSERT INTO user_analytics (user_id, action, metadata, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      `,
        [
          req.user.id,
          'support_comment_added',
          JSON.stringify({
            ticket_id,
            comment_id: commentId,
            is_internal: isInternalComment,
          }),
          req.ip,
          req.get('User-Agent'),
        ],
      );

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: { comment: createdComment },
      });
    } catch (error) {
      console.error('🎫 [SUPPORT] Add comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Update ticket (user can update their own, admin can update any)
  static async updateTicket(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const { ticket_id } = req.params;
      const { status, priority, assigned_to, resolution } = req.body;

      // Check if ticket exists
      const ticket = await database.get(
        `
        SELECT * FROM support_tickets WHERE id = $1
      `,
        [ticket_id],
      );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
      }

      // Check permissions
      const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
      if (ticket.user_id !== req.user.id && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Build update query dynamically
      const updates = [];
      const params = [];
      let paramIndex = 1;

      if (status !== undefined) {
        updates.push(`status = $${paramIndex}`);
        params.push(status);
        paramIndex++;
      }

      if (priority !== undefined) {
        updates.push(`priority = $${paramIndex}`);
        params.push(priority);
        paramIndex++;
      }

      if (assigned_to !== undefined) {
        // Only admins can assign tickets
        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'Only admins can assign tickets',
          });
        }
        updates.push(`assigned_to = $${paramIndex}`);
        params.push(assigned_to);
        paramIndex++;
      }

      if (resolution !== undefined) {
        updates.push(`resolution = $${paramIndex}`);
        params.push(resolution);
        paramIndex++;
      }

      // If status transitions to resolved, set resolved_at regardless of resolution text
      if (status !== undefined && status === 'resolved' && ticket.status !== 'resolved') {
        updates.push('resolved_at = CURRENT_TIMESTAMP');
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid updates provided',
        });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(ticket_id);

      const updateQuery = `
        UPDATE support_tickets 
        SET ${updates.join(', ')} 
        WHERE id = $${paramIndex}
      `;

      await database.run(updateQuery, params);

      // Get updated ticket
      const updatedTicket = await database.get(
        `
        SELECT 
          st.*,
          u.first_name,
          u.last_name,
          u.email,
          assigned_user.first_name as assigned_first_name,
          assigned_user.last_name as assigned_last_name
        FROM support_tickets st
        JOIN users u ON st.user_id = u.id
        LEFT JOIN users assigned_user ON st.assigned_to = assigned_user.id
        WHERE st.id = $1
      `,
        [ticket_id],
      );

      // Create notification for ticket owner if status changed
      if (status !== undefined && status !== ticket.status) {
        const NotificationController = require('./NotificationController');
        await NotificationController.createTicketStatusNotification(ticket_id, status, req.user.id);
      }

      // Track ticket update activity
      await database.run(
        `
        INSERT INTO user_analytics (user_id, action, metadata, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      `,
        [
          req.user.id,
          'support_ticket_updated',
          JSON.stringify({
            ticket_id,
            updates: { status, priority, assigned_to, resolution },
          }),
          req.ip,
          req.get('User-Agent'),
        ],
      );

      res.json({
        success: true,
        message: 'Ticket updated successfully',
        data: { ticket: updatedTicket },
      });
    } catch (error) {
      console.error('Update ticket error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get all tickets (admin only)
  static async getAllTickets(req, res) {
    try {
      // Admin permissions already checked by requireAdmin middleware
      // No additional check needed here

      const { page = 1, limit = 20, status, priority, assigned_to } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          st.*,
          u.first_name,
          u.last_name,
          u.email,
          assigned_user.first_name as assigned_first_name,
          assigned_user.last_name as assigned_last_name,
          COALESCE(COUNT(tc.id), 0) as comment_count
        FROM support_tickets st
        JOIN users u ON st.user_id = u.id
        LEFT JOIN users assigned_user ON st.assigned_to = assigned_user.id
        LEFT JOIN ticket_comments tc ON st.id = tc.ticket_id
        WHERE 1=1
      `;

      const params = [];

      if (status) {
        query += ` AND st.status = $${params.length + 1}`;
        params.push(status);
      }

      if (priority) {
        query += ` AND st.priority = $${params.length + 1}`;
        params.push(priority);
      }

      if (assigned_to) {
        query += ` AND st.assigned_to = $${params.length + 1}`;
        params.push(assigned_to);
      }

      query += `
        GROUP BY st.id, u.first_name, u.last_name, u.email, assigned_user.first_name, assigned_user.last_name
        ORDER BY st.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      params.push(limit, offset);

      const tickets = await database.all(query, params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM support_tickets WHERE 1=1';
      const countParams = [];

      if (status) {
        countQuery += ` AND status = $${countParams.length + 1}`;
        countParams.push(status);
      }

      if (priority) {
        countQuery += ` AND priority = $${countParams.length + 1}`;
        countParams.push(priority);
      }

      if (assigned_to) {
        countQuery += ` AND assigned_to = $${countParams.length + 1}`;
        countParams.push(assigned_to);
      }

      const totalCount = await database.get(countQuery, countParams);

      res.json({
        success: true,
        data: {
          tickets,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount.total,
            totalPages: Math.ceil(totalCount.total / limit),
          },
        },
      });
    } catch (error) {
      console.error('Get all tickets error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get support statistics (admin only)
  static async getSupportStats(req, res) {
    try {
      // Admin permissions already checked by requireAdmin middleware
      // No additional check needed here

      const { timeframe = '30d' } = req.query;

      const timeFrameMap = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
      };

      const days = timeFrameMap[timeframe] || 30;

      // Overall statistics
      const overallStats = await database.get(
        `
        SELECT 
          COUNT(*) as total_tickets,
          COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tickets,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_tickets,
          COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets,
          COUNT(DISTINCT user_id) as unique_users,
          AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_resolution_time_hours
        FROM support_tickets 
        WHERE created_at > NOW() - INTERVAL '1 day' * $1
      `,
        [days],
      );

      // Tickets by priority
      const priorityStats = await database.all(
        `
        SELECT 
          priority,
          COUNT(*) as count
        FROM support_tickets 
        WHERE created_at > NOW() - INTERVAL '1 day' * $1
        GROUP BY priority
        ORDER BY 
          CASE priority 
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
          END
      `,
        [days],
      );

      // Tickets by category
      const categoryStats = await database.all(
        `
        SELECT 
          category,
          COUNT(*) as count
        FROM support_tickets 
        WHERE created_at > NOW() - INTERVAL '1 day' * $1
        GROUP BY category
        ORDER BY count DESC
      `,
        [days],
      );

      // Daily ticket creation trends
      const dailyTrends = await database.all(
        `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as tickets_created,
          COUNT(CASE WHEN status = 'resolved' THEN 1 END) as tickets_resolved
        FROM support_tickets 
        WHERE created_at > NOW() - INTERVAL '1 day' * $1
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
        [days],
      );

      // Most active users
      const activeUsers = await database.all(
        `
        SELECT 
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          COUNT(st.id) as ticket_count
        FROM users u
        JOIN support_tickets st ON u.id = st.user_id
        WHERE st.created_at > NOW() - INTERVAL '1 day' * $1
        GROUP BY u.id, u.email, u.first_name, u.last_name
        ORDER BY ticket_count DESC
        LIMIT 10
      `,
        [days],
      );

      res.json({
        success: true,
        data: {
          total: parseInt(overallStats?.total_tickets) || 0,
          open: parseInt(overallStats?.open_tickets) || 0,
          inProgress: parseInt(overallStats?.in_progress_tickets) || 0,
          closed: parseInt(overallStats?.closed_tickets) || 0,
          // Additional detailed stats for future use
          detailed: {
            overallStats: overallStats || {
              total_tickets: 0,
              open_tickets: 0,
              in_progress_tickets: 0,
              resolved_tickets: 0,
              closed_tickets: 0,
              unique_users: 0,
              avg_resolution_time_hours: 0,
            },
            priorityStats,
            categoryStats,
            dailyTrends,
            activeUsers,
            timeframe,
          },
        },
      });
    } catch (error) {
      console.error('Support stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Delete ticket (admin only)
  static async deleteTicket(req, res) {
    try {
      const { ticket_id } = req.params;

      // Check if ticket exists
      const ticket = await database.get(
        `
        SELECT * FROM support_tickets WHERE id = $1
      `,
        [ticket_id],
      );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket not found',
        });
      }

      // Delete ticket and its comments (CASCADE should handle comments)
      await database.run('DELETE FROM support_tickets WHERE id = $1', [ticket_id]);

      res.json({
        success: true,
        message: 'Ticket deleted successfully',
      });
    } catch (error) {
      console.error('Delete ticket error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

module.exports = SupportController;
