/**
 * Consolidated Admin Routes
 * Handles all /api/admin/* endpoints in a single serverless function
 *
 * Routes:
 * - GET /api/admin/users - List all users
 * - GET /api/admin/users/[id] - Get user details
 * - PUT /api/admin/users/[id] - Update user
 * - DELETE /api/admin/users/[id] - Deactivate user
 */

const { withAdminRoute } = require('../middleware/serverless');
const { prisma } = require('../lib/prisma');

async function handler(req, res) {
  const { method } = req;
  const path = req.url.replace('/api/admin', '').split('?')[0];

  // ============ USERS ROUTES ============

  // GET /api/admin/users - List all users
  if (path === '/users' && method === 'GET') {
    try {
      const { page = 1, limit = 50, role, search } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};
      if (role) where.role = role;
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { first_name: { contains: search, mode: 'insensitive' } },
          { last_name: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            role: true,
            department: true,
            job_title: true,
            is_active: true,
            is_verified: true,
            created_at: true,
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.user.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        data: { users },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
      });
    }
  }

  // Routes with /users/[id]
  const userIdMatch = path.match(/^\/users\/(\d+)/);
  if (userIdMatch) {
    const userId = parseInt(userIdMatch[1]);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required',
      });
    }

    // GET /api/admin/users/[id]
    if (path === `/users/${userId}` && method === 'GET') {
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
            is_verified: true,
            two_factor_enabled: true,
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
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch user',
        });
      }
    }

    // PUT /api/admin/users/[id]
    if (path === `/users/${userId}` && method === 'PUT') {
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
        return res.status(500).json({
          success: false,
          message: 'Failed to update user',
        });
      }
    }

    // DELETE /api/admin/users/[id]
    if (path === `/users/${userId}` && method === 'DELETE') {
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
        return res.status(500).json({
          success: false,
          message: 'Failed to deactivate user',
        });
      }
    }
  }

  return res.status(404).json({
    success: false,
    message: `Route not found: ${method} ${path}`,
  });
}

module.exports = withAdminRoute(handler);
