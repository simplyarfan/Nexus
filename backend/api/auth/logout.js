/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */

const { withProtectedRoute } = require('../../middleware/serverless');
const prisma = require('../../lib/prisma');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const userId = req.user.userId;
    const token = req.headers.authorization?.substring(7); // Remove 'Bearer '

    if (token) {
      // Delete specific session
      await prisma.userSession.deleteMany({
        where: {
          user_id: userId,
          session_token: token,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to logout',
    });
  }
}

module.exports = withProtectedRoute(handler);
