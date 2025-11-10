/**
 * POST /api/auth/resend-verification
 * Resend email verification code
 */

const { withMiddleware } = require('../../middleware/serverless');
const { resendVerificationCode } = require('../../services/auth.service');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const { userId } = req.body;
    const result = await resendVerificationCode(userId);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to resend verification code',
    });
  }
}

module.exports = withMiddleware(handler);
