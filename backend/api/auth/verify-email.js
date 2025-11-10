/**
 * POST /api/auth/verify-email
 * Verify email with code from auth.service
 */

const { withMiddleware } = require('../../middleware/serverless');
const { verifyEmail } = require('../../services/auth.service');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const { userId, code } = req.body;
    const result = await verifyEmail(userId, code);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Email verification failed',
    });
  }
}

module.exports = withMiddleware(handler);
