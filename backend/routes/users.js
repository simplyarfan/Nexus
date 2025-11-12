const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin } = require('../middleware/roleCheck');
const bcrypt = require('bcryptjs');

/**
 * Get all users (admin/superadmin only)
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, department, search, page = 1, limit = 50 } = req.query;

    const where = {};

    if (role) {
      where.role = role;
    }

    if (department) {
      where.department = department;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

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
          last_login: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message,
    });
  }
});

/**
 * Get single user (admin/superadmin only)
 */
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
      });
    }

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
        created_at: true,
        updated_at: true,
        last_login: true,
        failed_login_attempts: true,
        two_factor_enabled: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error.message,
    });
  }
});

/**
 * Create user (superadmin only)
 */
router.post('/', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { email, password, first_name, last_name, role, department, job_title } = req.body;

    // Validation
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, first name, and last name are required',
      });
    }

    if (!['user', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be: user, admin, or superadmin',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        first_name,
        last_name,
        role: role || 'user',
        department,
        job_title,
        is_active: true,
        is_verified: true, // Auto-verify users created by superadmin
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
        created_at: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message,
    });
  }
});

/**
 * Update user department (admin/superadmin)
 * Update other fields (superadmin only)
 */
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { first_name, last_name, role, department, job_title, is_active } = req.body;
    const currentUser = req.user;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
      });
    }

    // Check user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Build update data based on role
    const updateData = {};

    // Admin can ONLY change department
    if (currentUser.role === 'admin') {
      if (department !== undefined) {
        updateData.department = department;
      }

      // If admin tries to change anything else, reject
      if (
        first_name !== undefined ||
        last_name !== undefined ||
        role !== undefined ||
        job_title !== undefined ||
        is_active !== undefined
      ) {
        return res.status(403).json({
          success: false,
          error: 'Admins can only change user departments. Contact a superadmin for other changes.',
        });
      }
    }

    // Superadmin can change everything
    if (currentUser.role === 'superadmin') {
      if (first_name !== undefined) updateData.first_name = first_name;
      if (last_name !== undefined) updateData.last_name = last_name;
      if (role !== undefined) {
        if (!['user', 'admin', 'superadmin'].includes(role)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid role. Must be: user, admin, or superadmin',
          });
        }
        updateData.role = role;
      }
      if (department !== undefined) updateData.department = department;
      if (job_title !== undefined) updateData.job_title = job_title;
      if (is_active !== undefined) updateData.is_active = is_active;
    }

    updateData.updated_at = new Date();

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        department: true,
        job_title: true,
        is_active: true,
        updated_at: true,
      },
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: error.message,
    });
  }
});

/**
 * Change user password (superadmin only)
 */
router.patch('/:id/password', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { new_password } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
      });
    }

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long',
      });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash,
        updated_at: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update password',
      message: error.message,
    });
  }
});

/**
 * Delete user (superadmin only)
 */
router.delete('/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUser = req.user;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
      });
    }

    // Prevent self-deletion
    if (userId === currentUser.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
      });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: error.message,
    });
  }
});

module.exports = router;
