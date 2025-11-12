/**
 * Consolidated Auth Routes
 * Handles all /api/auth/* endpoints in a single serverless function
 *
 * Routes:
 * - POST /api/auth/login
 * - POST /api/auth/register
 * - POST /api/auth/logout
 * - GET/PUT /api/auth/profile
 * - POST /api/auth/refresh-token
 * - POST /api/auth/verify-email
 * - POST /api/auth/resend-verification
 * - POST /api/auth/verify-2fa
 * - POST /api/auth/resend-2fa
 * - POST /api/auth/forgot-password
 * - POST /api/auth/reset-password
 * - PUT /api/auth/change-password
 * - GET /api/auth/check-user
 */

const { withMiddleware, withProtectedRoute } = require('../middleware/serverless');
const {
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  verifyUserEmail,
  resendVerificationEmail,
  verify2FACode,
  resend2FACode,
  forgotPassword,
  resetPassword,
  changePassword,
} = require('../services/auth.service');
const { prisma } = require('../lib/prisma');

// Main router handler
async function handler(req, res) {
  const { method } = req;
  const path = req.url.replace('/api/auth', '').split('?')[0];

  // ============ PUBLIC ROUTES (no auth required) ============

  // POST /api/auth/login
  if (path === '/login' && method === 'POST') {
    try {
      const { email, password, rememberMe } = req.body;
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'] || 'Unknown';

      const result = await loginUser({
        email,
        password,
        rememberMe,
        ipAddress,
        userAgent,
      });

      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
        ...(error.requiresVerification && {
          requiresVerification: true,
          userId: error.userId,
        }),
      });
    }
  }

  // POST /api/auth/register
  if (path === '/register' && method === 'POST') {
    try {
      const { email, password, firstName, lastName, department, jobTitle } = req.body;

      const result = await registerUser({
        email,
        password,
        firstName,
        lastName,
        department,
        jobTitle,
      });

      return res.status(201).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /api/auth/refresh-token
  if (path === '/refresh-token' && method === 'POST') {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      const result = await refreshAccessToken(refreshToken);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 401;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /api/auth/verify-email
  if (path === '/verify-email' && method === 'POST') {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Verification token is required',
        });
      }

      const result = await verifyUserEmail(token);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /api/auth/resend-verification
  if (path === '/resend-verification' && method === 'POST') {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      const result = await resendVerificationEmail(email);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /api/auth/verify-2fa
  if (path === '/verify-2fa' && method === 'POST') {
    try {
      const { userId, code } = req.body;

      if (!userId || !code) {
        return res.status(400).json({
          success: false,
          message: 'User ID and code are required',
        });
      }

      const result = await verify2FACode(userId, code);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /api/auth/resend-2fa
  if (path === '/resend-2fa' && method === 'POST') {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      const result = await resend2FACode(userId);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /api/auth/forgot-password
  if (path === '/forgot-password' && method === 'POST') {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      const result = await forgotPassword(email);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // POST /api/auth/reset-password
  if (path === '/reset-password' && method === 'POST') {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({
          success: false,
          message: 'Token and password are required',
        });
      }

      const result = await resetPassword(token, password);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET /api/auth/check-user
  if (path === '/check-user' && method === 'GET') {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required',
        });
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, is_verified: true },
      });

      return res.status(200).json({
        success: true,
        data: {
          exists: !!user,
          emailVerified: user?.is_verified || false,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to check user',
      });
    }
  }

  // ============ PROTECTED ROUTES (auth required) ============
  // These need the user to be authenticated via JWT

  // POST /api/auth/logout
  if (path === '/logout' && method === 'POST') {
    try {
      // Get user from JWT (added by auth middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      const result = await logoutUser(req.user.userId);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // GET/PUT /api/auth/profile
  if (path === '/profile') {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    const userId = req.user.userId;

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
            is_verified: true,
            two_factor_enabled: true,
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
              emailVerified: user.is_verified,
              is2FAEnabled: user.two_factor_enabled,
              createdAt: user.created_at,
            },
          },
        });
      } catch (error) {
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
        return res.status(500).json({
          success: false,
          message: 'Failed to update profile',
        });
      }
    }
  }

  // PUT /api/auth/change-password
  if (path === '/change-password' && method === 'PUT') {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required',
        });
      }

      const result = await changePassword(req.user.userId, currentPassword, newPassword);
      return res.status(200).json(result);
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  // If no route matched
  return res.status(404).json({
    success: false,
    message: `Route not found: ${method} ${path}`,
  });
}

// Wrap with middleware that handles both public and protected routes
// We'll apply auth conditionally inside the handler
module.exports = withMiddleware(handler);
