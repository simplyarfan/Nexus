/**
 * /api/cv-intelligence/batches
 * GET - List all CV analysis batches for user
 */

const { withProtectedRoute } = require('../../middleware/serverless');
const { getUserBatches } = require('../../services/cv.service');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const userId = req.user.userId;
    const batches = await getUserBatches(userId);

    return res.status(200).json({
      success: true,
      data: batches,
      message: 'CV batches retrieved successfully',
    });
  } catch (error) {
    console.error('Get batches error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve batches',
    });
  }
}

module.exports = withProtectedRoute(handler);
