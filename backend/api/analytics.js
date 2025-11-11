/**
 * Consolidated Analytics Routes
 * Handles all /api/analytics/* endpoints in a single serverless function
 *
 * Routes:
 * - GET /api/analytics - Get analytics data with time range
 * - GET /api/analytics/dashboard - Dashboard analytics
 * - GET /api/analytics/overview - High-level overview stats
 * - POST /api/analytics/track - Track custom analytics events
 */

const { withProtectedRoute } = require('../middleware/serverless');
const { pool } = require('../config/database');
const prisma = require('../lib/prisma');

async function handler(req, res) {
  const { method } = req;
  const userId = req.user.userId;
  const path = req.url.replace('/api/analytics', '').split('?')[0];

  // GET /api/analytics/dashboard - Dashboard analytics
  if (path === '/dashboard' && method === 'GET') {
    try {
      // Get ticket stats
      const [openTickets, resolvedTickets, totalTickets] = await Promise.all([
        prisma.supportTicket.count({
          where: {
            user_id: userId,
            status: 'open',
          },
        }),
        prisma.supportTicket.count({
          where: {
            user_id: userId,
            status: 'resolved',
          },
        }),
        prisma.supportTicket.count({
          where: { user_id: userId },
        }),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          openTickets,
          resolvedTickets,
          totalTickets,
          cvAnalyses: 0, // Placeholder - requires CV table
          interviews: 0, // Placeholder - requires interviews table
        },
      });
    } catch (error) {
      console.error('Dashboard analytics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
      });
    }
  }

  // GET /api/analytics/overview - High-level overview stats
  if (path === '/overview' && method === 'GET') {
    try {
      const overviewResult = await pool.query(
        `SELECT
           (SELECT COUNT(*) FROM api_logs WHERE user_id = $1) as total_api_calls,
           (SELECT COUNT(*) FROM projects WHERE user_id = $1) as total_projects,
           (SELECT COUNT(*) FROM workflows WHERE user_id = $1) as total_workflows,
           (SELECT created_at FROM users WHERE id = $1) as member_since`,
        [userId]
      );

      return res.status(200).json({
        success: true,
        overview: overviewResult.rows[0],
      });
    } catch (error) {
      console.error('Error fetching overview:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch overview data',
      });
    }
  }

  // POST /api/analytics/track - Track custom analytics events
  if (path === '/track' && method === 'POST') {
    try {
      const { event, metadata = {} } = req.body;

      if (!event) {
        return res.status(400).json({
          success: false,
          message: 'Event name is required',
        });
      }

      await pool.query(
        `INSERT INTO analytics_events (user_id, event, metadata)
         VALUES ($1, $2, $3)`,
        [userId, event, JSON.stringify(metadata)]
      );

      return res.status(200).json({
        success: true,
        message: 'Event tracked successfully',
      });
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to track event',
      });
    }
  }

  // GET /api/analytics - Get analytics data with time range
  if (path === '' && method === 'GET') {
    try {
      const { timeRange = '7d' } = req.query;

      // Calculate date range
      const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
      const days = daysMap[timeRange] || 7;

      // Get API usage stats
      const apiUsageResult = await pool.query(
        `SELECT
           DATE(created_at) as date,
           COUNT(*) as requests,
           COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
           COUNT(CASE WHEN status = 'error' THEN 1 END) as failed
         FROM api_logs
         WHERE user_id = $1
           AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
         GROUP BY DATE(created_at)
         ORDER BY date DESC`,
        [userId]
      );

      // Get total usage summary
      const summaryResult = await pool.query(
        `SELECT
           COUNT(*) as total_requests,
           COUNT(CASE WHEN status = 'success' THEN 1 END) as total_successful,
           COUNT(CASE WHEN status = 'error' THEN 1 END) as total_failed,
           AVG(response_time) as avg_response_time
         FROM api_logs
         WHERE user_id = $1
           AND created_at >= CURRENT_DATE - INTERVAL '${days} days'`,
        [userId]
      );

      // Get endpoint breakdown
      const endpointsResult = await pool.query(
        `SELECT
           endpoint,
           COUNT(*) as count,
           AVG(response_time) as avg_response_time
         FROM api_logs
         WHERE user_id = $1
           AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
         GROUP BY endpoint
         ORDER BY count DESC
         LIMIT 10`,
        [userId]
      );

      return res.status(200).json({
        success: true,
        analytics: {
          timeRange,
          summary: summaryResult.rows[0] || {},
          dailyUsage: apiUsageResult.rows,
          topEndpoints: endpointsResult.rows,
        },
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics data',
      });
    }
  }

  return res.status(404).json({
    success: false,
    message: `Route not found: ${method} ${path}`,
  });
}

module.exports = withProtectedRoute(handler);
