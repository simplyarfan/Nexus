/**
 * Admin Users Management
 * GET /api/admin/users - List all users
 * POST /api/admin/users - Create user (admin only)
 */

const { withAdminRoute } = require('../../middleware/serverless');
const prisma = require('../../lib/prisma');

async function handler(req, res) {
  const { method } = req;

  // GET - List users
  if (method === 'GET') {
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
            email_verified: true,
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
      console.error('List users error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: 'Method not allowed',
  });
}

module.exports = withAdminRoute(handler);
