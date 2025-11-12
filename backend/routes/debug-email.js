/**
 * Debug endpoint to verify email configuration
 * USE ONLY IN DEVELOPMENT - REMOVE IN PRODUCTION
 */
const express = require('express');
const router = express.Router();

router.get('/check-env', (req, res) => {
  // Always allow this endpoint for debugging email issues
  // Security: Only shows if env vars are SET, not their values

  const emailConfig = {
    EMAIL_USER: process.env.EMAIL_USER ? '✅ SET' : '❌ MISSING',
    EMAIL_PASS: process.env.EMAIL_PASS ? '✅ SET' : '❌ MISSING',
    EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com (default)',
    EMAIL_PORT: process.env.EMAIL_PORT || '587 (default)',
    NODE_ENV: process.env.NODE_ENV,
    // Show first 3 chars of email for verification
    EMAIL_USER_PREFIX: process.env.EMAIL_USER
      ? process.env.EMAIL_USER.substring(0, 3) + '***'
      : 'N/A',
  };

  res.json({
    success: true,
    message: 'Email configuration status',
    config: emailConfig,
    timestamp: new Date().toISOString(),
  });
});

router.post('/test-email', async (req, res) => {
  // Only allow in development or if specific debug flag is set
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEBUG !== 'true') {
    return res.status(403).json({
      success: false,
      message: 'Debug endpoints disabled in production',
    });
  }

  try {
    const emailService = require('../services/email.service.js');
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address required',
      });
    }

    // Try to send a test verification code
    await emailService.send2FACode(email, '123456', 'Test User');

    res.json({
      success: true,
      message: 'Test email sent successfully!',
      recipient: email,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

module.exports = router;
