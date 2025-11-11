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
      // TODO: Implement overview stats when analytics tables are set up
      return res.status(200).json({
        success: true,
        overview: {
          total_api_calls: 0,
          total_projects: 0,
          total_workflows: 0,
          member_since: new Date(),
        },
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

      // TODO: Implement event tracking when analytics tables are set up
      console.log('Analytics event:', { userId, event, metadata });

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

      // TODO: Implement analytics when api_logs table is set up
      return res.status(200).json({
        success: true,
        analytics: {
          timeRange,
          summary: {
            total_requests: 0,
            total_successful: 0,
            total_failed: 0,
            avg_response_time: 0,
          },
          dailyUsage: [],
          topEndpoints: [],
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
