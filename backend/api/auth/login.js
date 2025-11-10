/**
 * POST /api/auth/login
 * User login endpoint (serverless function)
 */

const { withMiddleware } = require('../../middleware/serverless');
const { loginUser } = require('../../services/auth.service');

async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const { email, password, rememberMe } = req.body;

    // Get client info
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await loginUser({
      email,
      password,
      rememberMe,
      ipAddress,
      userAgent,
    });

    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message,
      ...(error.requiresVerification && {
        requiresVerification: true,
        userId: error.userId,
      }),
    });
  }
}

module.exports = withMiddleware(handler);
