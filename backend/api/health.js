/**
 * GET /api/health
 * Health check endpoint with database connectivity test
 */

const { withMiddleware } = require('../middleware/serverless');
const { prisma } = require('../lib/prisma');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    // Test database connection with a simple query
    await prisma.$queryRaw`SELECT 1 as test`;

    return res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'API is running',
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.error('Health check database error:', error);
    
    return res.status(200).json({
      success: true,
      status: 'degraded',
      timestamp: new Date().toISOString(),
      message: 'API is running but database is unavailable',
      database: 'disconnected',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database connection failed',
    });
  }
}

module.exports = withMiddleware(handler);
