/**
 * POST /api/auth/check-user
 * Check if user exists by email (serverless function)
 * Used for Microsoft OAuth flow to determine if user needs to register
 */

const { withMiddleware } = require('../../middleware/serverless');
const { checkUserExists } = require('../../services/auth.service');

async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const { email } = req.body;

    const result = await checkUserExists(email);

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = withMiddleware(handler);
