const responseTime = require('response-time');

/**
 * Performance monitoring middleware
 */

// Response time middleware
const responseTimeMiddleware = responseTime((req, res, time) => {
  // Log slow requests (> 1 second)
  if (time > 1000) {
    console.warn(`Slow request: ${req.method} ${req.url} - ${time.toFixed(2)}ms`);
  }
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';

    console[`${logLevel}`](`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
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

  // Log memory usage if heap usage is high
  if (memoryUsageMB.heapUsed > 100) {
    console.warn('High memory usage:', memoryUsageMB);
  }

  next();
};

module.exports = {
  responseTimeMiddleware,
  requestLogger,
  memoryMonitor,
};
