/**
 * Single User Operations (Admin)
 * GET /api/admin/users/:id - Get user details
 * PUT /api/admin/users/:id - Update user
 * DELETE /api/admin/users/:id - Deactivate user
 */

const { withAdminRoute } = require('../../../middleware/serverless');
const prisma = require('../../../lib/prisma');

async function handler(req, res) {
  const { method, query } = req;
  const userId = parseInt(query.id);

  if (!userId || isNaN(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid user ID is required',
    });
  }

  // GET - User details
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
          updated_at: true,
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
        data: { user },
      });
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
      });
    }
  }

  // PUT - Update user
  if (method === 'PUT') {
    try {
      const { role, is_active, department, job_title } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(role && { role }),
          ...(typeof is_active === 'boolean' && { is_active }),
          ...(department !== undefined && { department }),
          ...(job_title !== undefined && { job_title }),
          updated_at: new Date(),
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          is_active: true,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: { user: updatedUser },
      });
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user',
      });
    }
  }

  // DELETE - Deactivate user
  if (method === 'DELETE') {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { is_active: false },
      });

      return res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
      });
    } catch (error) {
      console.error('Deactivate user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to deactivate user',
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
  });
}

module.exports = withAdminRoute(handler);
