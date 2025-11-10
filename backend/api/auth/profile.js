/**
 * GET /api/auth/profile - Get current user profile
 * PUT /api/auth/profile - Update user profile
 * Protected route requiring authentication
 */

const { withProtectedRoute } = require('../../middleware/serverless');
const prisma = require('../../lib/prisma');

async function handler(req, res) {
  const { method } = req;
  const userId = req.user.userId; // From JWT token

  // GET profile
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
          is_active: true,
          email_verified: true,
          is_2fa_enabled: true,
          created_at: true,
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
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            name: `${user.first_name} ${user.last_name}`,
            role: user.role,
            department: user.department,
            jobTitle: user.job_title,
            isActive: user.is_active,
            emailVerified: user.email_verified,
            is2FAEnabled: user.is_2fa_enabled,
            createdAt: user.created_at,
          },
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
      });
    }
  }

  // PUT profile (update)
  if (method === 'PUT') {
    try {
      const { firstName, lastName, department, jobTitle } = req.body;

      // Validation
      if (!firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: 'First name and last name are required',
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          first_name: firstName,
          last_name: lastName,
          department: department || null,
          job_title: jobTitle || null,
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
          is_active: true,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.first_name,
            lastName: updatedUser.last_name,
            name: `${updatedUser.first_name} ${updatedUser.last_name}`,
            role: updatedUser.role,
            department: updatedUser.department,
            jobTitle: updatedUser.job_title,
            isActive: updatedUser.is_active,
          },
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile',
      });
    }
  }

  // Method not allowed
  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
  });
}

module.exports = withProtectedRoute(handler);
