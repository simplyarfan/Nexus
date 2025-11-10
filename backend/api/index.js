/**
 * Vercel Serverless Function - Single Entry Point
 * Consolidates all API routes into one function to stay within Hobby plan limits (12 functions max)
 */

const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || (origin && origin.includes('netlify.app'))) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in production for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is healthy', timestamp: new Date().toISOString() });
});

// Import and mount route handlers
try {
  // Auth routes
  const authLogin = require('./auth/login');
  const authRegister = require('./auth/register');
  const authLogout = require('./auth/logout');
  const authProfile = require('./auth/profile');
  const authRefreshToken = require('./auth/refresh-token');
  const authVerifyEmail = require('./auth/verify-email');
  const authResendVerification = require('./auth/resend-verification');
  const authVerify2FA = require('./auth/verify-2fa');
  const authResend2FA = require('./auth/resend-2fa');
  const authForgotPassword = require('./auth/forgot-password');
  const authResetPassword = require('./auth/reset-password');
  const authChangePassword = require('./auth/change-password');
  const authCheckUser = require('./auth/check-user');

  app.post('/api/auth/login', authLogin);
  app.post('/api/auth/register', authRegister);
  app.post('/api/auth/logout', authLogout);
  app.get('/api/auth/profile', authProfile);
  app.put('/api/auth/profile', authProfile);
  app.post('/api/auth/refresh-token', authRefreshToken);
  app.post('/api/auth/verify-email', authVerifyEmail);
  app.post('/api/auth/resend-verification', authResendVerification);
  app.post('/api/auth/verify-2fa', authVerify2FA);
  app.post('/api/auth/resend-2fa', authResend2FA);
  app.post('/api/auth/forgot-password', authForgotPassword);
  app.post('/api/auth/reset-password', authResetPassword);
  app.put('/api/auth/change-password', authChangePassword);
  app.get('/api/auth/check-user', authCheckUser);

  // Admin routes
  const adminUsers = require('./admin/users');
  app.get('/api/admin/users', adminUsers);
  app.post('/api/admin/users', adminUsers);
  app.put('/api/admin/users/:id', adminUsers);
  app.delete('/api/admin/users/:id', adminUsers);

  // Analytics routes
  const analyticsHandler = require('./analytics');
  app.get('/api/analytics/*', analyticsHandler);
  app.get('/api/analytics', analyticsHandler);

  // Support routes
  const supportHandler = require('./support');
  app.all('/api/support/*', supportHandler);
  app.all('/api/support', supportHandler);

  // Tickets routes
  const ticketsIndex = require('./tickets/index');
  const ticketsId = require('./tickets/[id]');
  const ticketsComments = require('./tickets/[id]/comments');

  app.get('/api/tickets', ticketsIndex);
  app.post('/api/tickets', ticketsIndex);
  app.get('/api/tickets/:id', ticketsId);
  app.patch('/api/tickets/:id', ticketsId);
  app.delete('/api/tickets/:id', ticketsId);
  app.post('/api/tickets/:id/comments', ticketsComments);

  // Interview Coordinator routes
  const interviews = require('./interview-coordinator/interviews');
  const interviewById = require('./interview-coordinator/interview/[id]');

  app.all('/api/interview-coordinator/*', interviews);
  app.all('/api/interview-coordinator', interviews);
  app.all('/api/interview/:id', interviewById);

  // CV Intelligence routes (if they exist)
  try {
    const cvIntelligence = require('./cv-intelligence/index');
    app.all('/api/cv-intelligence/*', cvIntelligence);
    app.all('/api/cv-intelligence', cvIntelligence);
  } catch (e) {
    console.log('CV Intelligence routes not available');
  }

} catch (error) {
  console.error('Error loading routes:', error);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Export for Vercel
module.exports = app;
