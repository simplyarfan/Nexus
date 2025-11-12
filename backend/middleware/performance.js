const responseTime = require('response-time');

/**
 * Performance monitoring middleware
 */

// Response time middleware
const responseTimeMiddleware = responseTime((req, res, time) => {
  // Track slow requests (> 1 second)
  if (time > 1000) {
    // Slow request detected
  }
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    // Request completed
  });

  next();
};

// Memory usage monitoring
const memoryMonitor = (req, res, next) => {
  const used = process.memoryUsage();
  const memoryUsageMB = {
    rss: Math.round((used.rss / 1024 / 1024) * 100) / 100,
    heapTotal: Math.round((used.heapTotal / 1024 / 1024) * 100) / 100,
    heapUsed: Math.round((used.heapUsed / 1024 / 1024) * 100) / 100,
    external: Math.round((used.external / 1024 / 1024) * 100) / 100,
  };

  // Monitor memory usage if heap usage is high
  if (memoryUsageMB.heapUsed > 100) {
    // High memory usage detected
  }

  next();
};

module.exports = {
  responseTimeMiddleware,
  requestLogger,
  memoryMonitor,
};
