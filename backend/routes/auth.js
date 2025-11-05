const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const database = require('../models/database');
const googleCalendarService = require('../services/googleCalendarService');
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

// User registration
router.post('/register', authLimiter, validateRegistration, AuthController.register);

// User login
router.post('/login', authLimiter, validateLogin, AuthController.login);

// Verify 2FA code
router.post(
  '/verify-2fa',
  authLimiter,
  trackActivity('2fa_verification'),
  AuthController.verify2FA,
);

// Resend 2FA code
router.post('/resend-2fa', authLimiter, trackActivity('2fa_resend'), AuthController.resend2FACode);

// Email verification during registration
router.post(
  '/verify-email',
  authLimiter,
  trackActivity('email_verification'),
  AuthController.verifyEmail,
);

// Resend verification code during registration
router.post(
  '/resend-verification',
  emailVerificationLimiter,
  trackActivity('verification_resend'),
  AuthController.resendVerificationCode,
);

// Request password reset
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validatePasswordResetRequest,
  validateCompanyDomain,
  trackActivity('password_reset_request'),
  AuthController.requestPasswordReset,
);

// Reset password
router.post(
  '/reset-password',
  passwordResetLimiter,
  validatePasswordReset,
  trackActivity('password_reset_attempt'),
  AuthController.resetPassword,
);

// Refresh access token
router.post('/refresh-token', cleanupExpiredSessions, AuthController.refreshToken);

// Protected routes (authentication required)

// Get current user profile
router.get(
  '/profile',
  authenticateToken,
  trackActivity('profile_viewed'),
  AuthController.getProfile,
);

// Update user profile
router.put(
  '/profile',
  authenticateToken,
  validateProfileUpdate,
  trackActivity('profile_updated'),
  AuthController.updateProfile,
);

// Change password
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
    console.error('Admin reset password route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Logout (current session)
router.post('/logout', authenticateToken, trackActivity('logout'), AuthController.logout);

// Logout from all devices
router.post(
  '/logout-all',
  authenticateToken,
  trackActivity('logout_all_devices'),
  AuthController.logoutAll,
);

/**
 * GET /outlook/auth - Initiate Outlook OAuth flow
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

    const backendUrl = process.env.BACKEND_URL || 'https://thesimpleai.vercel.app';
    const redirectUri = `${backendUrl}/api/auth/outlook/callback`;

    // Build OAuth authorization URL
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.append('client_id', process.env.OUTLOOK_CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_mode', 'query');
    authUrl.searchParams.append(
      'scope',
      'offline_access https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read',
    );
    authUrl.searchParams.append('state', req.user.id); // Pass user ID in state parameter
    authUrl.searchParams.append('prompt', 'select_account');

    res.json({
      success: true,
      authUrl: authUrl.toString(),
    });
  } catch (error) {
    console.error('Outlook auth initiation error:', error);
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

    const frontendUrl = process.env.FRONTEND_URL || 'https://thesimpleai.netlify.app';

    // Handle OAuth errors
    if (error) {
      console.error('❌ Outlook OAuth error:', error, error_description);
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
      console.error('❌ Outlook OAuth credentials not configured');
      return res.redirect(
        `${frontendUrl}/profile?outlook=error&message=Server configuration error`,
      );
    }

    console.log('✅ Received OAuth callback for user:', userId);

    // Exchange authorization code for tokens
    const axios = require('axios');
    const backendUrl = process.env.BACKEND_URL || 'https://thesimpleai.vercel.app';
    const redirectUri = `${backendUrl}/api/auth/outlook/callback`;

    const tokenResponse = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      new URLSearchParams({
        client_id: process.env.OUTLOOK_CLIENT_ID,
        client_secret: process.env.OUTLOOK_CLIENT_SECRET,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        scope:
          'offline_access https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    if (!refresh_token) {
      console.error('❌ No refresh token received. Make sure offline_access scope is requested.');
      return res.redirect(
        `${frontendUrl}/profile?outlook=error&message=Failed to obtain refresh token`,
      );
    }

    console.log('✅ Tokens received successfully');

    // Get user's email from Microsoft Graph
    const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userEmail = userResponse.data.userPrincipalName || userResponse.data.mail;
    console.log('✅ User email retrieved:', userEmail);

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Store tokens in database
    await database.connect();
    await database.run(
      `UPDATE users 
       SET outlook_access_token = $1,
           outlook_refresh_token = $2,
           outlook_token_expires_at = $3,
           outlook_email = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [access_token, refresh_token, expiresAt.toISOString(), userEmail, userId],
    );

    console.log('✅ Tokens stored in database for user:', userId);

    // Redirect back to frontend with success
    res.redirect(`${frontendUrl}/profile?outlook=connected`);
  } catch (error) {
    console.error('❌ Outlook OAuth callback error:', error.response?.data || error.message);
    const frontendUrl = process.env.FRONTEND_URL || 'https://thesimpleai.netlify.app';
    res.redirect(`${frontendUrl}/profile?outlook=error&message=Authentication failed`);
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
    console.error('Outlook status check error:', error);
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
    console.error('Outlook disconnect error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Outlook account',
      error: error.message,
    });
  }
});

/**
 * GET /google/auth - Initiate Google OAuth flow
 */
router.get(
  '/google/auth',
  authenticateToken,
  trackActivity('google_oauth_initiated'),
  async (req, res) => {
    try {
      const authUrl = googleCalendarService.getAuthUrl(req.user.id);
      res.json({
        success: true,
        authUrl,
      });
    } catch (error) {
      console.error('❌ Google OAuth initiation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate Google OAuth',
        error: error.message,
      });
    }
  },
);

/**
 * GET /google/callback - Handle Google OAuth callback
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required',
      });
    }

    // Exchange code for tokens
    const tokens = await googleCalendarService.getTokensFromCode(code);

    // Store tokens in database
    if (userId) {
      await googleCalendarService.storeUserTokens(userId, tokens);
    }

    // Redirect back to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'https://thesimpleai.netlify.app';
    res.redirect(`${frontendUrl}/profile?google_calendar=connected`);
  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'https://thesimpleai.netlify.app';
    res.redirect(`${frontendUrl}/profile?google_calendar=error`);
  }
});

/**
 * GET /google/status - Check if user has connected Google Calendar
 */
router.get('/google/status', authenticateToken, async (req, res) => {
  try {
    const isConnected = await googleCalendarService.isUserConnected(req.user.id);
    res.json({
      success: true,
      isConnected,
    });
  } catch (error) {
    console.error('❌ Google status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check Google Calendar connection status',
      error: error.message,
    });
  }
});

/**
 * POST /google/disconnect - Disconnect Google Calendar
 */
router.post(
  '/google/disconnect',
  authenticateToken,
  trackActivity('google_calendar_disconnected'),
  async (req, res) => {
    try {
      await googleCalendarService.disconnectUser(req.user.id);
      res.json({
        success: true,
        message: 'Google Calendar disconnected successfully',
      });
    } catch (error) {
      console.error('❌ Google disconnect error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to disconnect Google Calendar',
        error: error.message,
      });
    }
  },
);

module.exports = router;
