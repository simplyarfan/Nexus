/**
 * Main Express Server
 * Single entry point for all API routes
 */

const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://thesimpleai.netlify.app',
    'https://thesimpleai.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import route handlers
const authHandler = require('./api/auth');
const profileHandler = require('./api/profile');
const ticketsHandler = require('./api/tickets');
const adminHandler = require('./api/admin');
const analyticsHandler = require('./api/analytics');
const cvIntelligenceHandler = require('./api/cv-intelligence');
const interviewCoordinatorHandler = require('./api/interview-coordinator');
const supportHandler = require('./api/support');
const healthHandler = require('./api/health');

// Mount routes - use the handlers directly since they already have middleware
app.use('/api/auth', authHandler);
app.use('/api/profile', profileHandler);
app.use('/api/tickets', ticketsHandler);
app.use('/api/admin', adminHandler);
app.use('/api/analytics', analyticsHandler);
app.use('/api/cv-intelligence', cvIntelligenceHandler);
app.use('/api/interview-coordinator', interviewCoordinatorHandler);
app.use('/api/support', supportHandler);
app.use('/api/health', healthHandler);

// Favicon handler (prevent 500 errors)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/favicon.png', (req, res) => {
  res.status(204).end();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Nexus API Server',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/profile',
      '/api/tickets',
      '/api/admin',
      '/api/analytics',
      '/api/cv-intelligence',
      '/api/interview-coordinator',
      '/api/support',
      '/api/health'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
