/**
 * POST /api/auth/forgot-password
 * Request password reset email
 */

const { withMiddleware } = require('../../middleware/serverless');
const crypto = require('crypto');
const prisma = require('../../lib/prisma');
const emailService = require('../../services/email.service');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        first_name: true,
        is_active: true,
      },
    });

    // Always return success to prevent email enumeration
    if (!user || !user.is_active) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent',
      });
    }

    // Generate reset token (plain text to send, hashed to store)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store hashed reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: hashedToken,
        reset_token_expires: expiresAt,
        updated_at: new Date(),
      },
    });

    // Send reset email
    try {
      await emailService.sendPasswordReset(user.email, resetToken, user.first_name);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Continue anyway - token is stored
    }

    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

module.exports = withMiddleware(handler);
