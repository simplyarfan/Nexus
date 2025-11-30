const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AuthController = require('../controllers/AuthController');
const database = require('../models/database');
const cryptoUtil = require('../utils/crypto');
const { graphAPI: axios } = require('../utils/axios');
const {
  authenticateToken,
  validateCompanyDomain,
  trackActivity,
  cleanupExpiredSessions,
  requireSuperAdmin,
  requireAdmin,
} = require('../middleware/auth');

// Configure multer for profile picture uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});
const {
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
} = require('../middleware/rateLimiting');
const {
  validateRegistration,
  validateLogin,
  validateEmailVerification,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateProfileUpdate,
  validateEmailOnly,
  validateUserCreation,
  validateUserId,
  validatePagination,
  validateSearch,
  validateRole,
  validatePasswordChange,
} = require('../middleware/validation');

// Public routes (no authentication required)

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Create a new user account with email verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/register', authLimiter, validateRegistration, AuthController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticate user and receive JWT tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/login', authLimiter, validateLogin, AuthController.login);

/**
 * @swagger
 * /api/auth/verify-2fa:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify 2FA code
 *     description: Verify two-factor authentication code during login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 2FA verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post(
  '/verify-2fa',
  authLimiter,
  trackActivity('2fa_verification'),
  AuthController.verify2FA,
);

/**
 * @swagger
 * /api/auth/resend-2fa:
 *   post:
 *     tags: [Authentication]
 *     summary: Resend 2FA code
 *     description: Resend two-factor authentication code via email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: 2FA code resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 2FA code resent successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post('/resend-2fa', authLimiter, trackActivity('2fa_resend'), AuthController.resend2FACode);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify email address
 *     description: Verify user's email address using verification code sent during registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Email verified successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post(
  '/verify-email',
  emailVerificationLimiter, // More restrictive rate limiting for verification
  validateEmailVerification,
  trackActivity('email_verification'),
  AuthController.verifyEmail,
);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     tags: [Authentication]
 *     summary: Resend email verification code
 *     description: Resend email verification code to user's email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Verification code resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Verification code resent successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post(
  '/resend-verification',
  emailVerificationLimiter,
  trackActivity('verification_resend'),
  AuthController.resendVerificationCode,
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request password reset
 *     description: Send password reset link to user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset instructions sent to your email
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validatePasswordResetRequest,
  validateCompanyDomain,
  trackActivity('password_reset_request'),
  AuthController.requestPasswordReset,
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password with token
 *     description: Reset user password using the reset token from email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewSecurePass123!
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
router.post(
  '/reset-password',
  passwordResetLimiter,
  validatePasswordReset,
  trackActivity('password_reset_attempt'),
  AuthController.resetPassword,
);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     description: Get a new access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/refresh-token', cleanupExpiredSessions, AuthController.refreshToken);

// Protected routes (authentication required)

/**
 * @swagger
 * /api/auth/check:
 *   get:
 *     tags: [Authentication]
 *     summary: Check authentication status
 *     description: Verify if the user is authenticated and return user data
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auth check successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/check', authenticateToken, async (req, res) => {
  try {
    // Get user data from database (including profile_picture_url, two_factor_enabled, and preferences)
    const user = await database.get(
      `SELECT id, email, first_name, last_name, role, department, job_title, phone, bio, profile_picture_url, two_factor_enabled, timezone, date_format, created_at, updated_at
       FROM users
       WHERE id = $1`,
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
        role: user.role,
        department: user.department,
        job_title: user.job_title,
        phone: user.phone,
        bio: user.bio,
        profile_picture_url: user.profile_picture_url,
        two_factor_enabled: user.two_factor_enabled || false,
        timezone: user.timezone || 'Asia/Riyadh',
        date_format: user.date_format || 'MM/DD/YYYY',
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check authentication',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/profile',
  authenticateToken,
  trackActivity('profile_viewed'),
  AuthController.getProfile,
);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     tags: [Authentication]
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put(
  '/profile',
  authenticateToken,
  validateProfileUpdate,
  trackActivity('profile_updated'),
  AuthController.updateProfile,
);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     tags: [Authentication]
 *     summary: Change password
 *     description: Change the authenticated user's password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: OldPass123!
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewSecurePass123!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put(
  '/change-password',
  authenticateToken,
  validatePasswordChange,
  trackActivity('password_changed'),
  AuthController.changePassword,
);

// Enable 2FA
router.post(
  '/enable-2fa',
  authenticateToken,
  trackActivity('2fa_enabled'),
  AuthController.enable2FA,
);

// Disable 2FA
router.post(
  '/disable-2fa',
  authenticateToken,
  trackActivity('2fa_disabled'),
  AuthController.disable2FA,
);

// Get all users (superadmin only)
router.get(
  '/users',
  authenticateToken,
  requireSuperAdmin,
  validatePagination,
  validateSearch,
  validateRole,
  trackActivity('users_viewed'),
  AuthController.getAllUsers,
);

// Get user statistics (superadmin only)
router.get(
  '/stats',
  authenticateToken,
  requireSuperAdmin,
  trackActivity('user_stats_viewed'),
  AuthController.getUserStats,
);

// Get specific user (superadmin only)
router.get(
  '/users/:user_id',
  authenticateToken,
  requireSuperAdmin,
  validateUserId,
  trackActivity('user_details_viewed'),
  AuthController.getUser,
);

// Create new user (superadmin only)
router.post(
  '/users',
  authenticateToken,
  requireSuperAdmin,
  validateUserCreation,
  trackActivity('user_created'),
  AuthController.createUser,
);

// Update user (superadmin only)
router.put(
  '/users/:user_id',
  authenticateToken,
  requireSuperAdmin,
  validateUserId,
  trackActivity('user_updated'),
  AuthController.updateUser,
);

// Delete user (superadmin only)
router.delete(
  '/users/:user_id',
  authenticateToken,
  requireSuperAdmin,
  validateUserId,
  trackActivity('user_deleted'),
  AuthController.deleteUser,
);

// Admin route to reset user password (for debugging)
router.post('/admin/reset-password', authenticateToken, async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Superadmin role required.',
      });
    }

    await AuthController.adminResetUserPassword(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     description: Logout the current session and invalidate tokens
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout', authenticateToken, trackActivity('logout'), AuthController.logout);

// Logout from all devices
router.post(
  '/logout-all',
  authenticateToken,
  trackActivity('logout_all_devices'),
  AuthController.logoutAll,
);

/**
 * GET /outlook/auth - Initiate Outlook OAuth flow with PKCE
 */
router.get('/outlook/auth', authenticateToken, async (req, res) => {
  try {
    // Check if OAuth credentials are configured
    if (!process.env.OUTLOOK_CLIENT_ID) {
      return res.status(503).json({
        success: false,
        message:
          'Outlook OAuth is not configured. Please set OUTLOOK_CLIENT_ID environment variable.',
      });
    }

    if (!process.env.BACKEND_URL) {
      return res.status(503).json({
        success: false,
        message: 'Server configuration error: BACKEND_URL environment variable is required.',
      });
    }

    const crypto = require('crypto');

    // Generate PKCE code_verifier (random string)
    const codeVerifier = crypto.randomBytes(32).toString('base64url');

    // Generate PKCE code_challenge (SHA256 hash of code_verifier)
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    // Store code_verifier temporarily in database (will be used in callback)
    await database.connect();
    await database.run(
      `UPDATE users
       SET outlook_pkce_verifier = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [codeVerifier, req.user.id],
    );

    const backendUrl = process.env.BACKEND_URL;
    const redirectUri = `${backendUrl}/api/auth/outlook/callback`;

    // Build OAuth authorization URL with PKCE
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.append('client_id', process.env.OUTLOOK_CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_mode', 'query');
    authUrl.searchParams.append(
      'scope',
      'offline_access https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read https://graph.microsoft.com/OnlineMeetings.ReadWrite',
    );
    authUrl.searchParams.append('state', req.user.id); // Pass user ID in state parameter
    authUrl.searchParams.append('prompt', 'select_account');
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    res.json({
      success: true,
      authUrl: authUrl.toString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Outlook OAuth',
      error: error.message,
    });
  }
});

/**
 * GET /outlook/callback - Handle Outlook OAuth callback
 */
router.get('/outlook/callback', async (req, res) => {
  try {
    const { code, state: userId, error, error_description } = req.query;

    if (!process.env.FRONTEND_URL) {
      return res.status(503).json({
        success: false,
        message: 'Server configuration error: FRONTEND_URL environment variable is required.',
      });
    }

    const frontendUrl = process.env.FRONTEND_URL;

    // Handle OAuth errors
    if (error) {
      return res.redirect(
        `${frontendUrl}/profile?outlook=error&message=${encodeURIComponent(error_description || error)}`,
      );
    }

    if (!code) {
      return res.redirect(
        `${frontendUrl}/profile?outlook=error&message=No authorization code received`,
      );
    }

    if (!userId) {
      return res.redirect(`${frontendUrl}/profile?outlook=error&message=User session lost`);
    }

    // Check if OAuth credentials are configured
    if (!process.env.OUTLOOK_CLIENT_ID || !process.env.OUTLOOK_CLIENT_SECRET) {
      return res.redirect(
        `${frontendUrl}/profile?outlook=error&message=Server configuration error - credentials missing`,
      );
    }

    await database.connect();
    const user = await database.get('SELECT outlook_pkce_verifier FROM users WHERE id = $1', [
      userId,
    ]);

    if (!user || !user.outlook_pkce_verifier) {
      return res.redirect(
        `${frontendUrl}/profile?outlook=error&message=Session expired. Please try again`,
      );
    }

    const codeVerifier = user.outlook_pkce_verifier;

    // Exchange authorization code for tokens with PKCE
    if (!process.env.BACKEND_URL) {
      return res.redirect(
        `${frontendUrl}/profile?outlook=error&message=${encodeURIComponent('Server configuration error - BACKEND_URL missing')}`,
      );
    }

    const backendUrl = process.env.BACKEND_URL;
    const redirectUri = `${backendUrl}/api/auth/outlook/callback`;

    const tokenResponse = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      new URLSearchParams({
        client_id: process.env.OUTLOOK_CLIENT_ID,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
        scope:
          'offline_access https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read https://graph.microsoft.com/OnlineMeetings.ReadWrite',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    if (!refresh_token) {
      return res.redirect(
        `${frontendUrl}/profile?outlook=error&message=Failed to obtain refresh token`,
      );
    }

    const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userEmail = userResponse.data.userPrincipalName || userResponse.data.mail;

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // SECURITY: Encrypt OAuth tokens before storing in database
    // Use AES-256-GCM encryption to protect tokens from database breaches
    const encryptedAccessToken = cryptoUtil.encrypt(access_token);
    const encryptedRefreshToken = cryptoUtil.encrypt(refresh_token);

    // Store tokens in database and clear PKCE verifier
    await database.connect();
    await database.run(
      `UPDATE users
       SET outlook_access_token = $1,
           outlook_refresh_token = $2,
           outlook_token_expires_at = $3,
           outlook_email = $4,
           outlook_pkce_verifier = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [encryptedAccessToken, encryptedRefreshToken, expiresAt.toISOString(), userEmail, userId],
    );

    res.redirect(`${frontendUrl}/profile?outlook=connected`);
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL || 'https://your-frontend.netlify.app';
    const errorMessage =
      error.response?.data?.error_description ||
      error.message ||
      'Authentication failed. Please try again.';
    res.redirect(
      `${frontendUrl}/profile?outlook=error&message=${encodeURIComponent(errorMessage)}`,
    );
  }
});

/**
 * GET /outlook/status - Check Outlook connection status
 */
router.get('/outlook/status', authenticateToken, async (req, res) => {
  try {
    await database.connect();
    const user = await database.get(
      'SELECT outlook_email, outlook_token_expires_at FROM users WHERE id = $1',
      [req.user.id],
    );

    const isConnected = !!(user && user.outlook_email);
    const isExpired =
      isConnected &&
      user.outlook_token_expires_at &&
      new Date(user.outlook_token_expires_at) <= new Date();

    res.json({
      success: true,
      isConnected,
      isExpired,
      email: isConnected ? user.outlook_email : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check Outlook connection status',
      error: error.message,
    });
  }
});

// ========================================
// PROFILE PICTURE ROUTES
// ========================================

/**
 * POST /api/auth/profile/picture
 * Upload profile picture
 */
router.post(
  '/profile/picture',
  authenticateToken,
  upload.single('profilePicture'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
      }

      // Convert image to base64 data URL
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      // Update user's profile picture URL in database
      await database.run(
        `UPDATE users
       SET profile_picture_url = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
        [base64Image, req.user.id],
      );

      res.json({
        success: true,
        message: 'Profile picture updated successfully',
        data: {
          profile_picture_url: base64Image,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to upload profile picture',
        error: error.message,
      });
    }
  },
);

/**
 * DELETE /api/auth/profile/picture
 * Delete profile picture
 */
router.delete('/profile/picture', authenticateToken, async (req, res) => {
  try {
    await database.run(
      `UPDATE users
       SET profile_picture_url = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [req.user.id],
    );

    res.json({
      success: true,
      message: 'Profile picture deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile picture',
      error: error.message,
    });
  }
});

// ========================================
// TWO-FACTOR AUTHENTICATION ROUTES
// ========================================

/**
 * PUT /api/auth/two-factor/toggle
 * Toggle two-factor authentication for the user
 */
router.put('/two-factor/toggle', authenticateToken, async (req, res) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'enabled field must be a boolean',
      });
    }

    // Update user's 2FA status
    await database.run(
      `UPDATE users
       SET two_factor_enabled = $1,
           two_factor_secret = NULL,
           two_factor_code = NULL,
           two_factor_code_expires_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [enabled, req.user.id],
    );

    res.json({
      success: true,
      message: enabled
        ? 'Two-factor authentication enabled successfully'
        : 'Two-factor authentication disabled successfully',
      data: {
        two_factor_enabled: enabled,
      },
    });
  } catch (error) {
    console.error('2FA toggle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update two-factor authentication',
      error: error.message,
    });
  }
});

/**
 * Get user preferences
 * GET /api/auth/preferences
 */
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    // Get user preferences from database
    const user = await database.get(
      `SELECT timezone, date_format
       FROM users
       WHERE id = $1`,
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
        timezone: user.timezone || 'Asia/Riyadh',
        date_format: user.date_format || 'MM/DD/YYYY',
      },
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get preferences',
      error: error.message,
    });
  }
});

/**
 * Update user preferences
 * PUT /api/auth/preferences
 */
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const { timezone, date_format } = req.body;

    // Validate timezone
    const validTimezones = [
      'Asia/Riyadh',
      'Asia/Dubai',
      'Asia/Kolkata',
      'Asia/Singapore',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Australia/Sydney',
      'Pacific/Auckland',
    ];

    if (timezone && !validTimezones.includes(timezone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid timezone',
      });
    }

    // Validate date format
    const validDateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

    if (date_format && !validDateFormats.includes(date_format)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
      });
    }

    // Update user preferences
    await database.run(
      `UPDATE users
       SET timezone = COALESCE($1, timezone),
           date_format = COALESCE($2, date_format),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [timezone, date_format, req.user.id],
    );

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        timezone: timezone || undefined,
        date_format: date_format || undefined,
      },
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message,
    });
  }
});

// ========================================
// OUTLOOK OAUTH ROUTES
// ========================================

/**
 * GET /auth/outlook/connect
 * Initiate Outlook OAuth flow with PKCE
 */
router.get('/outlook/connect', authenticateToken, async (req, res) => {
  try {
    const { generatePKCEChallenge } = require('../utils/crypto');

    // Check if Outlook OAuth is configured
    if (!process.env.OUTLOOK_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Outlook OAuth is not configured on the server',
      });
    }

    // Generate PKCE challenge
    const { codeVerifier, codeChallenge } = generatePKCEChallenge();

    // Store PKCE verifier in database for this user
    const { prisma } = require('../lib/prisma');
    await prisma.users.update({
      where: { id: req.user.id },
      data: {
        outlook_pkce_verifier: cryptoUtil.encrypt(codeVerifier),
      },
    });

    // Build authorization URL
    const redirectUri = `${process.env.FRONTEND_URL}/auth/outlook/callback`;
    const scopes = [
      'https://graph.microsoft.com/Mail.Send',
      'https://graph.microsoft.com/User.Read',
      'https://graph.microsoft.com/OnlineMeetings.ReadWrite',
      'offline_access',
    ].join(' ');

    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.append('client_id', process.env.OUTLOOK_CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', scopes);
    authUrl.searchParams.append('state', req.user.id.toString());
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    authUrl.searchParams.append('response_mode', 'query');

    res.json({
      success: true,
      authUrl: authUrl.toString(),
    });
  } catch (error) {
    console.error('Outlook connect error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Outlook connection',
      error: error.message,
    });
  }
});

/**
 * POST /auth/outlook/callback
 * Handle Outlook OAuth callback
 */
router.post('/outlook/callback', authenticateToken, async (req, res) => {
  try {
    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required',
      });
    }

    // Verify state matches user ID
    if (parseInt(state) !== req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid state parameter',
      });
    }

    const { prisma } = require('../lib/prisma');

    // Get PKCE verifier from database
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: { outlook_pkce_verifier: true },
    });

    if (!user?.outlook_pkce_verifier) {
      return res.status(400).json({
        success: false,
        message: 'PKCE verifier not found. Please restart the connection process.',
      });
    }

    const codeVerifier = cryptoUtil.decrypt(user.outlook_pkce_verifier);

    // Exchange code for tokens
    const redirectUri = `${process.env.FRONTEND_URL}/auth/outlook/callback`;
    const tokenResponse = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      new URLSearchParams({
        client_id: process.env.OUTLOOK_CLIENT_ID,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user's email from Microsoft Graph
    const graphResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const outlookEmail = graphResponse.data.mail || graphResponse.data.userPrincipalName;

    // Store encrypted tokens in database
    const expiresAt = new Date(Date.now() + expires_in * 1000);
    await prisma.users.update({
      where: { id: req.user.id },
      data: {
        outlook_access_token: cryptoUtil.encrypt(access_token),
        outlook_refresh_token: cryptoUtil.encrypt(refresh_token),
        outlook_token_expires_at: expiresAt,
        outlook_email: outlookEmail,
        outlook_pkce_verifier: null, // Clear PKCE verifier after use
      },
    });

    res.json({
      success: true,
      message: 'Outlook connected successfully!',
      email: outlookEmail,
    });
  } catch (error) {
    console.error('Outlook callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect Outlook account',
      error: error.response?.data?.error_description || error.message,
    });
  }
});

/**
 * DELETE /auth/outlook/disconnect
 * Disconnect Outlook account
 */
router.delete('/outlook/disconnect', authenticateToken, async (req, res) => {
  try {
    const { prisma } = require('../lib/prisma');

    await prisma.users.update({
      where: { id: req.user.id },
      data: {
        outlook_access_token: null,
        outlook_refresh_token: null,
        outlook_token_expires_at: null,
        outlook_email: null,
        outlook_pkce_verifier: null,
      },
    });

    res.json({
      success: true,
      message: 'Outlook disconnected successfully',
    });
  } catch (error) {
    console.error('Outlook disconnect error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Outlook',
      error: error.message,
    });
  }
});

module.exports = router;
