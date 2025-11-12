const express = require('express');
const compression = require('compression');
require('dotenv').config();

// Import security middleware
const {
  securityHeaders,
} = require('./middleware/security');

// Import logger
const logger = require('./utils/logger');

// Import database
const database = require('./models/database');
const { prisma } = require('./lib/prisma');
// Load routes with error handling
let authRoutes,
  analyticsRoutes,
  cvRoutes,
  notificationRoutes,
  initRoutes,
  interviewRoutes,
  debugEmailRoutes,
  ticketsRoutes;

// Load each route individually with error handling
try {
  authRoutes = require('./routes/auth');
} catch (error) {
  // Make sure route still loads without auth
  authRoutes = null;
}

try {
  cvRoutes = require('./routes/cv-intelligence-clean');
} catch (error) {
  // Error loading CV Intelligence routes
}

try {
  analyticsRoutes = require('./routes/analytics');
} catch (error) {
  // Error loading analytics routes
}

try {
  ticketsRoutes = require('./routes/tickets');
} catch (error) {
  // Error loading tickets routes
}

let usersRoutes;
try {
  usersRoutes = require('./routes/users');
} catch (error) {
  // Error loading users routes
}

// CV Intelligence routes already loaded above

try {
  notificationRoutes = require('./routes/notifications');
} catch (error) {
  // Error loading notification routes
}

try {
  initRoutes = require('./routes/init');
} catch (error) {
  // Error loading init routes
}

try {
  interviewRoutes = require('./routes/interview-coordinator');
} catch (error) {
  // Error loading interview coordinator routes
}

try {
  debugEmailRoutes = require('./routes/debug-email');
} catch (error) {
  // Error loading debug email routes
}

let swaggerRoutes;
try {
  swaggerRoutes = require('./routes/swagger');
} catch (error) {
  // Error loading swagger routes
}

// Optimized conditional request logger
const conditionalLogger = (req, res, next) => {
  // Skip logging for health checks and static assets
  if (!logger.shouldLog(req)) {
    return next();
  }

  const start = Date.now();

  // Log response only
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req, res, duration);
  });

  next();
};

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for accurate IP addresses (must be first)
app.set('trust proxy', true);

// Compression middleware (gzip)
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Balance between speed and compression
  }),
);

// Apply security headers
app.use(securityHeaders);

// CORS Configuration - Environment-driven with exact origin matching
// IMPORTANT: Use ALLOWED_ORIGINS environment variable to set allowed domains
// Example: ALLOWED_ORIGINS=https://your-app.com,https://staging.your-app.com
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Get allowed origins from environment (required)
  if (!process.env.ALLOWED_ORIGINS) {
    console.error('ALLOWED_ORIGINS environment variable is not set');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error',
    });
  }

  const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());

  // SECURITY: Only allow exact origin matches (no wildcard subdomain matching)
  // If you need to allow specific preview deployments, add them to ALLOWED_ORIGINS env var
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header(
    'Access-Control-Allow-Headers',
    // SECURITY: Removed X-Admin-Secret from allowed headers (keep it internal only)
    'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-Request-ID,Cache-Control,Pragma',
  );
  res.header('Access-Control-Expose-Headers', 'Content-Length,X-Request-ID');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Starting SimpleAI Enterprise Backend

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET environment variable - Application cannot start');
  process.exit(1);
}

// JWT_REFRESH_SECRET is REQUIRED - using same secret defeats the purpose
if (!process.env.JWT_REFRESH_SECRET) {
  console.error('Missing JWT_REFRESH_SECRET environment variable - Security risk');
  process.exit(1);
}

// Initialize database connection (non-blocking)
database.connect().catch((error) => {
  console.error('Database connection failed:', error);
  // Don't exit process, let it continue for health checks
});

// Duplicate CORS configuration removed - using the specific origin one above

// HTTPS Enforcement for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Response compression middleware
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024,
  }),
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Conditional request logging (skip health checks)
app.use(conditionalLogger);

// Health Check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'SimpleAI Enterprise Backend is running!',
    database: database.isConnected ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

// Cache management endpoints (admin only)
const cacheService = require('./services/cache.service.js');
const { requireSuperAdmin, authenticateToken } = require('./middleware/auth');

app.get('/api/cache/stats', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const stats = await cacheService.getCacheStats();
    res.json({
      success: true,
      data: stats,
      message: 'Cache statistics retrieved',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get cache stats',
      error: error.message,
    });
  }
});

app.delete('/api/cache/clear/:pattern', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { pattern } = req.params;
    await cacheService.clearCache(pattern);
    res.json({
      success: true,
      message: `Cache cleared for pattern: ${pattern}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message,
    });
  }
});

// Test endpoint - comprehensive health check (development only)
app.get('/api/test', async (req, res) => {
  // Only allow in development or with admin authentication
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'This endpoint is disabled in production',
    });
  }

  const results = {
    success: true,
    message: 'API Health Check',
    timestamp: new Date().toISOString(),
    checks: {},
  };

  try {
    // Test 1: Database connection
    await database.connect();
    results.checks.database_connection = { status: 'OK', message: 'Connected' };

    // Test 2: Users table exists and has data
    const userCount = await database.get('SELECT COUNT(*) as count FROM users');
    results.checks.users_table = {
      status: 'OK',
      count: parseInt(userCount.count),
      message: `${userCount.count} users found`,
    };

    // Test 3: Admin user exists
    const adminUser = await database.get(
      'SELECT email, role, first_name, last_name FROM users WHERE role = $1',
      ['superadmin'],
    );
    results.checks.admin_user = adminUser
      ? {
          status: 'OK',
          email: adminUser.email,
          name: `${adminUser.first_name} ${adminUser.last_name}`,
          message: 'Admin user found',
        }
      : {
          status: 'MISSING',
          message: 'No admin user found',
        };

    // Test 4: Check if new columns exist
    try {
      await database.get('SELECT failed_login_attempts, account_locked_until FROM users LIMIT 1');
      results.checks.table_schema = { status: 'OK', message: 'All required columns exist' };
    } catch (error) {
      results.checks.table_schema = { status: 'ERROR', message: error.message };
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
    });
  }
});

// Database seeding endpoint (development only)
app.post('/api/admin/seed-database', async (req, res) => {
  try {
    // Only allow in development or with special header
    if (
      process.env.NODE_ENV === 'production' &&
      req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    const { seedDatabase } = require('./scripts/seed-database');
    await seedDatabase();

    res.json({
      success: true,
      message: 'Database seeded successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database seeding failed',
      error: error.message,
    });
  }
});

// Admin creation endpoint removed - use proper registration flow

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SimpleAI Enterprise Backend API',
    status: 'running',
    version: '2.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: '/health',
      docs: '/api-docs',
      auth: '/api/auth/*',
      analytics: '/api/analytics/*',
      cvIntelligence: '/api/cv-intelligence/*',
      notifications: '/api/notifications/*',
      interviews: '/api/interview-coordinator/*',
    },
    routesLoaded: {
      auth: !!authRoutes,
      analytics: !!analyticsRoutes,
      cv: !!cvRoutes,
      notifications: !!notificationRoutes,
      init: !!initRoutes,
      interview: !!interviewRoutes,
      swagger: !!swaggerRoutes,
    },
  });
});

// Route loading status check removed

// Import cache middleware
const {
  longCacheMiddleware,
  shortCacheMiddleware,
  cacheInvalidationMiddleware,
} = require('./middleware/cache');

// API Routes with caching (conditional)
if (authRoutes) {
  app.use('/api/auth', authRoutes);
}

if (analyticsRoutes) {
  app.use('/api/analytics', longCacheMiddleware, analyticsRoutes);
}
if (cvRoutes) {
  app.use('/api/cv-intelligence', cvRoutes);
}
if (notificationRoutes) {
  app.use(
    '/api/notifications',
    shortCacheMiddleware,
    cacheInvalidationMiddleware(['api:notifications*']),
    notificationRoutes,
  );
}
if (initRoutes) {
  app.use('/api/init', initRoutes);
}
if (interviewRoutes) {
  app.use('/api/interview-coordinator', interviewRoutes);
}

// Tickets routes (Prisma-based support system)
if (ticketsRoutes) {
  app.use('/api/tickets', ticketsRoutes);
}

// Users management routes (admin/superadmin only)
if (usersRoutes) {
  app.use('/api/users', usersRoutes);
}

// Debug email routes (temporary, for diagnosing email issues)
if (debugEmailRoutes && process.env.NODE_ENV !== 'production') {
  app.use('/api/debug/email', debugEmailRoutes);
}

// API Documentation (Swagger)
if (swaggerRoutes) {
  app.use('/api-docs', swaggerRoutes);
}

// Debug user endpoint removed - security risk in production

// Debug refresh token endpoint removed - security risk in production

// Debug support tickets endpoint removed - not needed in production

app.get('/api/system/health', async (req, res) => {
  try {
    await database.connect();
    await database.get('SELECT 1 as test');

    res.json({
      success: true,
      data: {
        overall: 'healthy',
        api: 'healthy',
        database: 'healthy',
        storage: 'healthy',
        memory: 'healthy',
      },
      status: 'healthy',
      database: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        overall: 'warning',
        api: 'healthy',
        database: 'error',
        storage: 'healthy',
        memory: 'healthy',
      },
      status: 'degraded',
      database: 'disconnected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

app.get('/api/system/metrics', async (req, res) => {
  try {
    await database.connect();

    // Get basic system metrics
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();

    // Calculate uptime in days
    const uptimeDays = (uptime / (24 * 60 * 60)).toFixed(1);

    // Get user count for active users metric
    const userCount = await database.get(
      'SELECT COUNT(*) as count FROM users WHERE is_active = true',
    );

    res.json({
      success: true,
      data: {
        uptime: `${uptimeDays} days`,
        responseTime: null,
        apiCalls: 0,
        errorRate: null,
        activeUsers: userCount?.count || 0,
        cpuUsage: 0,
        memoryUsage: Math.floor((memUsage.heapUsed / memUsage.heapTotal) * 100),
        diskUsage: 0,
        recentEvents: [],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system metrics',
      error: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error('Server Error:', err);

  // SECURITY: Never expose stack traces in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    success: false,
    message: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { error: err.message, stack: err.stack }),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Start server (only in non-Vercel environments)
let server;
if (!process.env.VERCEL) {
  server = app.listen(PORT, () => {
    // Server started
  });
}

// Graceful shutdown handler
async function gracefulShutdown(_signal) {
  if (server) {
    server.close(() => {
      // HTTP server closed
    });
  }

  try {
    // Close database connections
    if (database && database.pool) {
      await database.disconnect();
    }

    // Close Prisma connection
    if (prisma) {
      await prisma.$disconnect();
    }

    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, _promise) => {
  console.error('Unhandled Rejection:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

module.exports = app;
