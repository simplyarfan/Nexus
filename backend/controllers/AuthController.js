const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const database = require('../models/database');
const { validationResult } = require('express-validator');
const ResponseOptimizer = require('../utils/responseOptimizer');
const { generate2FACode, verify2FACode } = require('../utils/twoFactorAuth');
const emailService = require('../services/email.service.js');

// Helper function to generate secure JWT tokens
const generateTokens = (userId, email, role, rememberMe = false) => {
  // Ensure JWT secrets are configured
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  // Debug logging
  console.log('🔑 [TOKEN] Generating token with JWT_SECRET:', process.env.JWT_SECRET.substring(0, 20) + '...');

  // Use JWT_SECRET as fallback for refresh token if not set
  const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

  const accessToken = jwt.sign(
    { userId, email, role, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }, // Changed from 15m to 24h for better UX
  );

  // Extended expiration if remember me is enabled
  const refreshTokenExpiry = rememberMe ? '90d' : '30d';

  const refreshToken = jwt.sign({ userId, type: 'refresh' }, refreshSecret, {
    expiresIn: refreshTokenExpiry,
  });

  return { accessToken, refreshToken, expiresIn: rememberMe ? 90 : 30 };
};

// Register new user - With Email Verification
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, department, jobTitle } = req.body;

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required',
      });
    }

    // Ensure database connection
    await database.connect();

    // Check if user already exists
    const existingUser = await database.get('SELECT id, is_verified FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);

    if (existingUser) {
      if (existingUser.is_verified) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email address',
        });
      }
      // User exists but not verified - resend verification code
      const { code, hashedCode, expiresAt } = generate2FACode();

      await database.run(
        `
        UPDATE users SET 
          verification_token = $1,
          verification_expiry = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `,
        [hashedCode, expiresAt, existingUser.id],
      );

      // CRITICAL: Send verification email BEFORE responding
      try {
        await emailService.send2FACode(email.toLowerCase(), code, firstName);

        // Only respond after successful email send
        res.status(200).json({
          success: true,
          requiresVerification: true,
          userId: existingUser.id,
          message: 'Verification code sent to your email',
        });
      } catch (emailError) {
        console.error(
          `❌ [EMAIL] Failed to resend verification email to ${email}:`,
          emailError.message,
        );
        return res.status(500).json({
          success: false,
          message: 'Failed to send verification email. Please try again or contact support.',
          error:
            process.env.NODE_ENV === 'development'
              ? emailError.message
              : 'Email service unavailable',
        });
      }

      return; // IMPORTANT: Stop execution after sending resend response
    }

    // Hash password with enterprise-grade security
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate verification code
    const { code, hashedCode, expiresAt } = generate2FACode();

    // Create user (unverified)
    const result = await database.run(
      `
      INSERT INTO users (
        email, password_hash, first_name, last_name, 
        department, job_title, role, is_active, is_verified,
        verification_token, verification_expiry,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, email, first_name, last_name, role
    `,
      [
        email.toLowerCase(),
        hashedPassword,
        firstName,
        lastName,
        department || null,
        jobTitle || null,
        'user', // Default role
        true, // Active by default
        false, // NOT verified yet
        hashedCode,
        expiresAt,
      ],
    );

    if (!result.rows || result.rows.length === 0) {
      throw new Error('Failed to create user account');
    }

    const newUser = result.rows[0];

    // CRITICAL: Send verification email BEFORE responding to user
    try {
      await emailService.send2FACode(newUser.email, code, newUser.first_name);

      // Only send success response if email was sent successfully
      res.status(201).json({
        success: true,
        requiresVerification: true,
        userId: newUser.id,
        message: 'Registration successful! Please check your email for verification code.',
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError.message);

      // Delete the user we just created since email failed
      await database.run('DELETE FROM users WHERE id = $1', [newUser.id]);

      // Send error response
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again or contact support.',
        error:
          process.env.NODE_ENV === 'development' ? emailError.message : 'Email service unavailable',
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Login user - Enterprise Grade
const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    await database.connect();

    // Get user with security checks
    const user = await database.get(
      `
      SELECT id, email, password_hash, first_name, last_name, role, 
             department, job_title, is_active, is_verified, failed_login_attempts, account_locked_until
      FROM users WHERE email = $1
    `,
      [email.toLowerCase()],
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password BEFORE checking verification status
    // This prevents account enumeration attacks
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
      let lockUntil = null;

      // Lock account after 5 failed attempts for 15 minutes
      if (newFailedAttempts >= 5) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }

      await database.run(
        `
        UPDATE users SET 
          failed_login_attempts = $1,
          account_locked_until = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `,
        [newFailedAttempts, lockUntil, user.id],
      );

      return res.status(401).json({
        success: false,
        message: lockUntil
          ? 'Too many failed attempts. Account locked for 15 minutes.'
          : 'Incorrect password. Please try again.',
      });
    }

    // Check if email is verified (AFTER password check)
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        requiresVerification: true,
        userId: user.id,
        message:
          'Please verify your email address first. Check your inbox for the verification code.',
      });
    }

    // Check if account is locked
    if (user.account_locked_until && new Date() < new Date(user.account_locked_until)) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to failed login attempts',
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Check if 2FA is enabled for this user
    if (user.two_factor_enabled) {
      // Generate 2FA code
      const { code, hashedCode, expiresAt } = generate2FACode();

      // Store 2FA code in database
      await database.run(
        `
        UPDATE users SET 
          two_factor_code = $1,
          two_factor_code_expires_at = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `,
        [hashedCode, expiresAt, user.id],
      );

      // Send 2FA code via email
      try {
        await emailService.send2FACode(user.email, code, user.first_name);
      } catch (emailError) {
        console.error('Failed to send 2FA email:', emailError);
        // Continue anyway - code is logged in dev mode
      }

      // Return response indicating 2FA is required
      return res.json({
        success: true,
        requires2FA: true,
        message: 'Verification code sent to your email',
        userId: user.id, // Temporary ID for verification step
        rememberMe: rememberMe || false, // Pass through for 2FA completion
      });
    }

    // Reset failed login attempts on successful login
    await database.run(
      `
      UPDATE users SET 
        failed_login_attempts = 0,
        account_locked_until = NULL,
        last_login = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
      [user.id],
    );

    // Generate tokens with remember me support
    const {
      accessToken,
      refreshToken,
      expiresIn: _expiresIn,
    } = generateTokens(user.id, user.email, user.role, rememberMe || false);

    // Create session record
    await database.run(
      `
      INSERT INTO user_sessions (user_id, session_token, refresh_token, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        user.id,
        accessToken,
        refreshToken,
        req.ip,
        req.get('User-Agent') || 'Unknown',
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ],
    );

    res.json({
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
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      await database.connect();

      // Deactivate session
      await database.run(
        `
        UPDATE user_sessions SET is_active = false WHERE session_token = $1
      `,
        [token],
      );
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          first_name: req.user.first_name,
          last_name: req.user.last_name,
          role: req.user.role,
          department: req.user.department,
          job_title: req.user.job_title,
          is_active: req.user.is_active,
        },
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    await database.connect();

    // Fetch fresh user data including Outlook fields
    const user = await database.get(
      `
      SELECT id, email, first_name, last_name, role, department, job_title, 
             is_active, outlook_email, outlook_access_token
      FROM users 
      WHERE id = $1
    `,
      [req.user.id],
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          department: user.department,
          jobTitle: user.job_title,
          isActive: user.is_active,
          outlook_email: user.outlook_email,
          outlook_connected: !!user.outlook_access_token, // Boolean flag
        },
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone, job_title, bio } = req.body;
    const userId = req.user.id;

    await database.connect();

    await database.run(
      `
      UPDATE users SET
        first_name = $1,
        last_name = $2,
        phone = $3,
        job_title = $4,
        bio = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `,
      [first_name, last_name, phone, job_title, bio, userId],
    );

    const updatedUser = await database.get(
      'SELECT id, email, first_name, last_name, role, department, job_title, phone, bio, is_active FROM users WHERE id = $1',
      [userId],
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};

// Check authentication status
const checkAuth = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
    }

    await database.connect();

    // Fetch fresh user data including Outlook fields
    const user = await database.get(
      `
      SELECT id, email, first_name, last_name, role, department, job_title, 
             is_active, outlook_email, outlook_access_token
      FROM users 
      WHERE id = $1
    `,
      [req.user.id],
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        department: user.department,
        job_title: user.job_title,
        is_active: user.is_active,
        outlook_email: user.outlook_email,
        outlook_connected: !!user.outlook_access_token, // Boolean flag
      },
    });
  } catch (error) {
    console.error('Check auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication check failed',
    });
  }
};

// Get all users (superadmin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (page - 1) * limit;

    await database.connect();

    let query = `
      SELECT id, email, first_name, last_name, role, department, job_title, 
             is_active, created_at, last_login
      FROM users 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (role) {
      query += ` AND role = $${paramIndex}`;
      countQuery += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (search) {
      query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      countQuery += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const [users, totalResult] = await Promise.all([
      database.all(query, params),
      database.get(countQuery, params.slice(0, -2)),
    ]);

    const total = totalResult.total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    await database.connect();

    const stats = await database.all(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN role = 'superadmin' THEN 1 END) as superadmin_count,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as user_count,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as new_users_30d
      FROM users
    `);

    res.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics',
    });
  }
};

// Get specific user
const getUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    await database.connect();
    const user = await database.get(
      'SELECT id, email, first_name, last_name, role, department, job_title, is_active, created_at, last_login FROM users WHERE id = $1',
      [user_id],
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    // Handle both frontend field name variations
    const {
      email,
      password,
      firstName,
      lastName,
      first_name,
      last_name,
      role = 'user',
      department,
      jobTitle,
      job_title,
    } = req.body;

    const finalFirstName = firstName || first_name;
    const finalLastName = lastName || last_name;
    const finalJobTitle = jobTitle || job_title;
    const finalPassword = password || crypto.randomBytes(12).toString('hex');

    if (!email || !finalFirstName || !finalLastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, first name, and last name are required',
      });
    }

    await database.connect();

    // Check if user exists
    const existingUser = await database.get('SELECT id FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(finalPassword, 12);

    const result = await database.run(
      `
      INSERT INTO users (email, password_hash, first_name, last_name, role, department, job_title, is_active, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `,
      [
        email.toLowerCase(),
        hashedPassword,
        finalFirstName,
        finalLastName,
        role,
        department,
        finalJobTitle,
        true,
        true,
      ],
    );

    const userId = result.rows[0]?.id || result.id;

    const newUser = await database.get(
      'SELECT id, email, first_name, last_name, role, department, job_title, is_active FROM users WHERE id = $1',
      [userId],
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: newUser,
        temporaryPassword: password ? undefined : finalPassword, // Only return temp password if we generated it
      },
    });
  } catch (error) {
    console.error('Create user error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const {
      first_name,
      last_name,
      firstName,
      lastName,
      email,
      role,
      department,
      job_title,
      jobTitle,
      is_active,
      newPassword, // Add password field
    } = req.body;

    // Handle field name variations
    const finalFirstName = firstName || first_name;
    const finalLastName = lastName || last_name;
    const finalJobTitle = jobTitle || job_title;

    await database.connect();

    const user = await database.get('SELECT * FROM users WHERE id = $1', [user_id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If password is provided, hash it
    if (newPassword && newPassword.trim()) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await database.run(
        `
        UPDATE users SET 
          first_name = $1,
          last_name = $2,
          email = $3,
          role = $4,
          department = $5,
          job_title = $6,
          is_active = COALESCE($7, is_active),
          password_hash = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
      `,
        [
          finalFirstName,
          finalLastName,
          email,
          role,
          department,
          finalJobTitle,
          is_active,
          hashedPassword,
          user_id,
        ],
      );
    } else {
      // Update without changing password
      await database.run(
        `
        UPDATE users SET 
          first_name = $1,
          last_name = $2,
          email = $3,
          role = $4,
          department = $5,
          job_title = $6,
          is_active = COALESCE($7, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
      `,
        [finalFirstName, finalLastName, email, role, department, finalJobTitle, is_active, user_id],
      );
    }

    const updatedUser = await database.get(
      'SELECT id, email, first_name, last_name, role, department, job_title, is_active FROM users WHERE id = $1',
      [user_id],
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('Update user error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (parseInt(user_id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    await database.connect();

    const user = await database.get('SELECT * FROM users WHERE id = $1', [user_id]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get counts of related data before deletion for audit logging
    const relatedDataCounts = {};

    try {
      // Count CV batches
      const batchCount = await database.get(
        'SELECT COUNT(*) as count FROM cv_batches WHERE user_id = $1',
        [user_id],
      );
      relatedDataCounts.cvBatches = parseInt(batchCount.count);

      // Count CV candidates (through batches)
      const candidateCount = await database.get(
        `
        SELECT COUNT(*) as count FROM candidates 
        WHERE batch_id IN (SELECT id FROM cv_batches WHERE user_id = $1)
      `,
        [user_id],
      );
      relatedDataCounts.cvCandidates = parseInt(candidateCount.count);

      // Count support tickets
      const ticketCount = await database.get(
        'SELECT COUNT(*) as count FROM support_tickets WHERE user_id = $1',
        [user_id],
      );
      relatedDataCounts.supportTickets = parseInt(ticketCount.count);

      // Count ticket comments
      const commentCount = await database.get(
        'SELECT COUNT(*) as count FROM ticket_comments WHERE user_id = $1',
        [user_id],
      );
      relatedDataCounts.ticketComments = parseInt(commentCount.count);

      // Count notifications
      const notificationCount = await database.get(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1',
        [user_id],
      );
      relatedDataCounts.notifications = parseInt(notificationCount.count);

      // Count user sessions
      const sessionCount = await database.get(
        'SELECT COUNT(*) as count FROM user_sessions WHERE user_id = $1',
        [user_id],
      );
      relatedDataCounts.userSessions = parseInt(sessionCount.count);
    } catch (countError) {
      console.warn('Warning: Could not count related data:', countError.message);
    }

    // Log the deletion for audit purposes
    console.log(`User deletion: ${user.email} by ${req.user.email}`);

    // Delete the user (cascade deletion will handle related data)
    await database.run('DELETE FROM users WHERE id = $1', [user_id]);

    // Calculate total items deleted
    const totalItemsDeleted =
      1 + Object.values(relatedDataCounts).reduce((sum, count) => sum + count, 0);

    res.json({
      success: true,
      message: `User ${user.first_name} ${user.last_name} deleted successfully`,
      deletedData: {
        user: `${user.first_name} ${user.last_name} (${user.email})`,
        relatedItemsDeleted: relatedDataCounts,
        totalItemsDeleted: totalItemsDeleted,
      },
    });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    await database.connect();

    const user = await database.get('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await database.run(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedNewPassword, userId],
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
    });
  }
};

// Logout all sessions
const logoutAll = async (req, res) => {
  try {
    const userId = req.user.id;

    await database.connect();
    await database.run('DELETE FROM user_sessions WHERE user_id = $1', [userId]);

    res.json({
      success: true,
      message: 'Logged out from all devices',
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout from all devices',
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(refreshToken, refreshSecret);

    await database.connect();
    const user = await database.get(
      'SELECT id, email, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId],
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id,
      user.email,
      user.role,
    );

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
};

// Resend 2FA code
const resend2FACode = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    await database.connect();

    // Get user
    const user = await database.get(
      `
      SELECT id, email, first_name, two_factor_enabled, two_factor_code_expires_at
      FROM users 
      WHERE id = $1 AND is_active = true
    `,
      [userId],
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid request',
      });
    }

    if (!user.two_factor_enabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled for this user',
      });
    }

    // Rate limiting: Check if last code was sent less than 1 minute ago
    if (user.two_factor_code_expires_at) {
      const lastSent = new Date(user.two_factor_code_expires_at).getTime() - 10 * 60 * 1000;
      const oneMinuteAgo = Date.now() - 60 * 1000;

      if (lastSent > oneMinuteAgo) {
        return res.status(429).json({
          success: false,
          message: 'Please wait before requesting a new code',
        });
      }
    }

    // Generate new 2FA code
    const { code, hashedCode, expiresAt } = generate2FACode();

    // Store new 2FA code
    await database.run(
      `
      UPDATE users SET 
        two_factor_code = $1,
        two_factor_code_expires_at = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `,
      [hashedCode, expiresAt, user.id],
    );

    // Send new code via email
    try {
      await emailService.send2FACode(user.email, code, user.first_name);
      console.log(`2FA code resent to: ${user.email}`);
    } catch (emailError) {
      console.error('Failed to resend 2FA email:', emailError);
    }

    res.json({
      success: true,
      message: 'A new verification code has been sent to your email',
    });
  } catch (error) {
    console.error('Resend 2FA code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification code',
    });
  }
};

// Verify 2FA code and complete login
const verify2FA = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        message: 'User ID and verification code are required',
      });
    }

    await database.connect();

    // Get user with 2FA code
    const user = await database.get(
      `
      SELECT id, email, first_name, last_name, role, department, job_title,
             two_factor_code, two_factor_code_expires_at
      FROM users 
      WHERE id = $1 AND is_active = true
    `,
      [userId],
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification request',
      });
    }

    // Verify 2FA code
    const isValid = verify2FACode(code, user.two_factor_code, user.two_factor_code_expires_at);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired verification code',
      });
    }

    // Clear 2FA code
    await database.run(
      `
      UPDATE users SET 
        two_factor_code = NULL,
        two_factor_code_expires_at = NULL,
        failed_login_attempts = 0,
        account_locked_until = NULL,
        last_login = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
      [user.id],
    );

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

    // Create session record
    await database.run(
      `
      INSERT INTO user_sessions (user_id, session_token, refresh_token, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        user.id,
        accessToken,
        refreshToken,
        req.ip,
        req.get('User-Agent') || 'Unknown',
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      ],
    );

    console.log(`2FA verified, user login: ${user.email}`);

    res.json({
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
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Enable 2FA for user
const enable2FA = async (req, res) => {
  try {
    const userId = req.user.id;

    await database.connect();
    await database.run(
      `
      UPDATE users SET 
        two_factor_enabled = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
      [userId],
    );

    console.log(`2FA enabled for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Two-factor authentication enabled',
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable two-factor authentication',
    });
  }
};

// Disable 2FA for user
const disable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to disable 2FA',
      });
    }

    await database.connect();

    // Verify password
    const user = await database.get('SELECT password_hash FROM users WHERE id = $1', [userId]);

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    // Disable 2FA
    await database.run(
      `
      UPDATE users SET 
        two_factor_enabled = false,
        two_factor_code = NULL,
        two_factor_code_expires_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
      [userId],
    );

    console.log(`2FA disabled for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Two-factor authentication disabled',
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable two-factor authentication',
    });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    await database.connect();

    // Check if user exists
    const user = await database.get(
      'SELECT id, email, first_name, is_active FROM users WHERE email = $1',
      [email.toLowerCase()],
    );

    // Always return success message to prevent email enumeration
    if (!user || !user.is_active) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent',
      });
    }

    // Generate reset token (secure random string)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    await database.run(
      `
      UPDATE users SET 
        reset_token = $1,
        reset_token_expiry = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `,
      [hashedToken, expiresAt, user.id],
    );

    // Send reset email
    try {
      await emailService.sendPasswordReset(user.email, resetToken, user.first_name);
      console.log(`Password reset email sent to: ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Continue anyway - token is logged in dev mode
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent',
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
    });
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required',
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    await database.connect();

    // Get all users with active reset tokens
    const users = await database.all(
      'SELECT id, email, reset_token, reset_token_expiry FROM users WHERE reset_token IS NOT NULL AND reset_token_expiry > NOW()',
    );

    // Find user with matching token
    let matchedUser = null;
    for (const user of users) {
      const isValid = await bcrypt.compare(token, user.reset_token);
      if (isValid) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await database.run(
      `
      UPDATE users SET 
        password_hash = $1,
        reset_token = NULL,
        reset_token_expiry = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
      [hashedPassword, matchedUser.id],
    );

    // Invalidate all existing sessions for security
    await database.run('DELETE FROM user_sessions WHERE user_id = $1', [matchedUser.id]);

    console.log(`Password reset successful for: ${matchedUser.email}`);

    res.json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
};

// Verify email during registration
const verifyEmail = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        message: 'User ID and verification code are required',
      });
    }

    await database.connect();

    // Fetch user with verification token
    const user = await database.get(
      'SELECT id, email, first_name, last_name, role, verification_token, verification_expiry, is_verified FROM users WHERE id = $1',
      [userId],
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
      });
    }

    if (!user.verification_token || !user.verification_expiry) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found. Please request a new one.',
      });
    }

    // Check expiry
    if (new Date() > new Date(user.verification_expiry)) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
      });
    }

    // Verify code using SHA256 hash (matching generate2FACode)
    const inputHash = crypto.createHash('sha256').update(code).digest('hex');
    const isValid = inputHash === user.verification_token;

    console.log(
      `[VERIFY] User: ${user.email}, Input: ${code}, InputHash: ${inputHash.substring(0, 10)}..., StoredHash: ${user.verification_token?.substring(0, 10)}..., Match: ${isValid}`,
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    // Mark as verified and clear tokens
    await database.run(
      `
      UPDATE users SET 
        is_verified = true,
        verification_token = NULL,
        verification_expiry = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
      [userId],
    );

    // Generate tokens for login
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

    // Create session record
    await database.run(
      `
      INSERT INTO user_sessions (user_id, session_token, refresh_token, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        user.id,
        accessToken,
        refreshToken,
        req.ip,
        req.get('User-Agent') || 'Unknown',
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ],
    );

    console.log(`Email verified and user logged in: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        is_active: true,
        is_verified: true,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Resend verification code during registration
const resendVerificationCode = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    await database.connect();

    const user = await database.get(
      'SELECT id, email, first_name, is_verified FROM users WHERE id = $1',
      [userId],
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
      });
    }

    // Generate new verification code
    const { code, hashedCode, expiresAt } = generate2FACode();

    await database.run(
      `
      UPDATE users SET 
        verification_token = $1,
        verification_expiry = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `,
      [hashedCode, expiresAt, userId],
    );

    // Send verification email
    try {
      await emailService.send2FACode(user.email, code, user.first_name);
      console.log(`Verification code resent to: ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    console.error('Resend verification code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification code',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

module.exports = {
  register,
  login,
  verify2FA,
  resend2FACode,
  enable2FA,
  disable2FA,
  logout,
  logoutAll,
  getCurrentUser,
  getProfile,
  updateProfile,
  checkAuth,
  getAllUsers,
  getUserStats,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  refreshToken,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  resendVerificationCode,
};
