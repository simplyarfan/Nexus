/**
 * GET /api/analytics/dashboard
 * Analytics dashboard data
 */

const { withProtectedRoute } = require('../../middleware/serverless');
const prisma = require('../../lib/prisma');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const userId = req.user.userId;

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

module.exports = withProtectedRoute(handler);
