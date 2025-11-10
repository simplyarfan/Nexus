/**
 * POST /api/auth/resend-2fa
 * Resend 2FA code during login (Production Ready)
 */

const { withMiddleware } = require('../../middleware/serverless');
const { generate2FACode } = require('../../utils/twoFactorAuth');
const emailService = require('../../services/email.service');
const prisma = require('../../lib/prisma');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Get user
    const user = await prisma.user.findFirst({
      where: {
        id: parseInt(userId),
        is_active: true,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        is_2fa_enabled: true,
        two_factor_code_expires: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid request',
      });
    }

    // Rate limiting: Check if last code was sent less than 30 seconds ago
    if (user.two_factor_code_expires) {
      const lastSent = new Date(user.two_factor_code_expires).getTime() - 10 * 60 * 1000;
      const thirtySecondsAgo = Date.now() - 30 * 1000;

      if (lastSent > thirtySecondsAgo) {
        const secondsLeft = Math.ceil((lastSent - thirtySecondsAgo) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsLeft} seconds before requesting a new code`,
        });
      }
    }

    // Generate new 2FA code
    const { code, hashedCode, expiresAt } = generate2FACode();

    // Update user with new code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        two_factor_code: hashedCode,
        two_factor_code_expires: expiresAt,
        updated_at: new Date(),
      },
    });

    // Send new code via email
    await emailService.send2FACode(user.email, code, user.first_name);

    return res.status(200).json({
      success: true,
      message: 'A new verification code has been sent to your email',
      expiresIn: '10 minutes',
    });
  } catch (error) {
    console.error('Resend 2FA code error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend verification code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

module.exports = withMiddleware(handler);
