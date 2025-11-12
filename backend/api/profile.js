/**
 * Profile Management API
 * Handles user profile operations (update name, password, photo, etc.)
 */

const { withProtectedRoute } = require('../middleware/serverless');
const { prisma } = require('../lib/prisma');
const bcrypt = require('bcryptjs');

async function handler(req, res) {
  const { method } = req;
  const userId = req.user.userId;

  // GET /api/profile - Get current user profile
  if (method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          department: true,
          job_title: true,
          created_at: true,
          last_login: true,
          two_factor_enabled: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
      });
    }
  }

  // PUT /api/profile - Update user profile
  if (method === 'PUT') {
    try {
      const { first_name, last_name, job_title } = req.body;

      // Validate input
      if (!first_name || !last_name) {
        return res.status(400).json({
          success: false,
          message: 'First name and last name are required',
        });
      }

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          job_title: job_title ? job_title.trim() : null,
          updated_at: new Date(),
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          department: true,
          job_title: true,
          created_at: true,
          last_login: true,
          two_factor_enabled: true,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile',
      });
    }
  }

  // POST /api/profile/password - Change password
  if (req.url.includes('/password') && method === 'POST') {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'All password fields are required',
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'New passwords do not match',
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
        });
      }

      // Get user with password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          password_hash: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: {
          password_hash: hashedPassword,
          updated_at: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to change password',
      });
    }
  }

  // POST /api/profile/photo - Upload profile photo
  if (req.url.includes('/photo') && method === 'POST') {
    // TODO: Implement profile photo upload with file storage
    // For now, return not implemented
    return res.status(501).json({
      success: false,
      message: 'Profile photo upload not yet implemented',
    });
  }

  return res.status(405).json({
    success: false,
    message: `Method ${method} not allowed`,
  });
}

module.exports = withProtectedRoute(handler);
