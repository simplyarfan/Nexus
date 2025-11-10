/**
 * /api/tickets/[id]
 * GET - Get single ticket with comments
 */

const { withProtectedRoute } = require('../../middleware/serverless');
const { getTicketById } = require('../../services/tickets.service');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const { id } = req.query; // Vercel provides route params in query
    const userId = req.user.userId;
    const userRole = req.user.role;

    const result = await getTicketById(id, userId, userRole);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: 'Failed to fetch ticket',
      message: error.message,
    });
  }
}

module.exports = withProtectedRoute(handler);
