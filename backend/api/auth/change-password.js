/**
 * PUT /api/auth/change-password
 * Change password for authenticated user (Production Ready)
 */

const { withProtectedRoute } = require('../../middleware/serverless');
const bcrypt = require('bcryptjs');
const prisma = require('../../lib/prisma');

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
      });
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain uppercase, lowercase, numbers, and special characters',
      });
    }

    // Get user's current password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password_hash: true, is_active: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Account is not active',
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password',
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password and reset failed login attempts
    await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: hashedNewPassword,
        failed_login_attempts: 0,
        account_locked_until: null,
        updated_at: new Date(),
      },
    });

    // Optional: Invalidate all existing sessions except current one
    // This forces re-login on all other devices
    const currentToken = req.headers.authorization?.substring(7);
    if (currentToken) {
      await prisma.userSession.deleteMany({
        where: {
          user_id: userId,
          session_token: {
            not: currentToken,
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      info: 'You have been logged out of all other devices',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

module.exports = withProtectedRoute(handler);
