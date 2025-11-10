/**
 * POST /api/auth/verify-2fa
 * Verify 2FA code and complete login (Production Ready)
 */

const { withMiddleware } = require('../../middleware/serverless');
const { verify2FACode } = require('../../utils/twoFactorAuth');
const { generateTokens } = require('../../lib/auth');
const prisma = require('../../lib/prisma');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        message: 'User ID and verification code are required',
      });
    }

    // Get user with 2FA code
    const user = await prisma.user.findFirst({
      where: {
        id: parseInt(userId),
        is_active: true,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        department: true,
        job_title: true,
        two_factor_code: true,
        two_factor_code_expires: true,
        account_locked_until: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification request',
      });
    }

    // Check if account is locked
    if (user.account_locked_until && new Date() < user.account_locked_until) {
      const minutesLeft = Math.ceil(
        (user.account_locked_until - new Date()) / 60000
      );
      return res.status(423).json({
        success: false,
        message: `Account is locked. Try again in ${minutesLeft} minutes`,
      });
    }

    // Verify 2FA code
    const verification = verify2FACode(
      code,
      user.two_factor_code,
      user.two_factor_code_expires
    );

    if (!verification.valid) {
      // Increment failed attempts
      const failedAttempts = await prisma.user.update({
        where: { id: user.id },
        data: {
          failed_login_attempts: {
            increment: 1,
          },
        },
        select: { failed_login_attempts: true },
      });

      // Lock account after 5 failed attempts
      if (failedAttempts.failed_login_attempts >= 5) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            account_locked_until: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          },
        });

        return res.status(423).json({
          success: false,
          message: 'Too many failed attempts. Account locked for 15 minutes',
        });
      }

      let message = 'Invalid or expired verification code';
      if (verification.reason === 'EXPIRED') {
        message = 'Verification code has expired. Please request a new one';
      } else if (verification.reason === 'NO_CODE') {
        message = 'No verification code found. Please login again';
      }

      return res.status(401).json({
        success: false,
        message,
        attemptsRemaining: 5 - failedAttempts.failed_login_attempts,
      });
    }

    // Clear 2FA code and reset failed attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        two_factor_code: null,
        two_factor_code_expires: null,
        failed_login_attempts: 0,
        account_locked_until: null,
        last_login: new Date(),
        updated_at: new Date(),
      },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.email,
      user.role
    );

    // Create session
    const ipAddress =
      req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await prisma.userSession.create({
      data: {
        user_id: user.id,
        session_token: accessToken,
        refresh_token: refreshToken,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        department: user.department,
        job_title: user.job_title,
      },
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Verification failed',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal server error',
    });
  }
}

module.exports = withMiddleware(handler);
