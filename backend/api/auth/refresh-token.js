/**
 * POST /api/auth/refresh-token
 * Refresh access token using refresh token
 */

const { withMiddleware } = require('../../middleware/serverless');
const { verifyRefreshToken, generateTokens } = require('../../lib/auth');
const prisma = require('../../lib/prisma');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if session exists and is valid
    const session = await prisma.userSession.findFirst({
      where: {
        refresh_token: refreshToken,
        user_id: decoded.userId,
        expires_at: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            is_active: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    if (!session.user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Generate new tokens
    const tokens = generateTokens(
      session.user.id,
      session.user.email,
      session.user.role
    );

    // Update session with new tokens
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        session_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.status(200).json({
      success: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
}

module.exports = withMiddleware(handler);
