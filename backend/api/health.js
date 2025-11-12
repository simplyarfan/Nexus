/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check endpoint
 *     description: Check system health including database connectivity and system metrics
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: System is unhealthy or degraded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
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

  const startTime = Date.now();
  const checks = {
    database: { status: 'unknown', latency: null },
  };

  // Database connectivity check
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    checks.database = {
      status: 'healthy',
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Connection failed',
    };
  }

  // Determine overall status
  const isHealthy = checks.database.status === 'healthy';
  const status = isHealthy ? 'healthy' : 'degraded';

  // System metrics
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  const response = {
    success: true,
    status,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime)}s`,
    checks,
    system: {
      node: process.version,
      platform: process.platform,
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
    },
    environment: process.env.NODE_ENV || 'development',
    responseTime: `${Date.now() - startTime}ms`,
  };

  return res.status(isHealthy ? 200 : 503).json(response);
}

module.exports = withMiddleware(handler);
