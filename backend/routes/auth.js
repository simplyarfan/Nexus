const express = require('express');
const router = express.Router();
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

// Check authentication status
router.get('/check', authenticateToken, AuthController.checkAuth);

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

/**
 * POST /outlook/disconnect - Disconnect Outlook account
 */
router.post('/outlook/disconnect', authenticateToken, async (req, res) => {
  try {
    await database.connect();
    await database.run(
      `UPDATE users 
       SET outlook_access_token = NULL,
           outlook_refresh_token = NULL,
           outlook_token_expires_at = NULL,
           outlook_email = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [req.user.id],
    );

    res.json({
      success: true,
      message: 'Outlook account disconnected successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Outlook account',
      error: error.message,
    });
  }
});

module.exports = router;
