const responseTime = require('response-time');
const { captureMessage, addBreadcrumb, setContext } = require('../config/sentry');
const logger = require('../utils/logger');

const SLOW_REQUEST_THRESHOLD = 1000;
const VERY_SLOW_REQUEST_THRESHOLD = 3000;

const performanceMonitoring = responseTime((req, res, time) => {
  const route = req.route?.path || req.path;
  const method = req.method;
  const statusCode = res.statusCode;

  const metadata = {
    method,
    route,
    statusCode,
    duration: Math.round(time),
    userId: req.user?.id || 'anonymous',
    ip: req.ip || req.connection.remoteAddress,
  };

  if (time > VERY_SLOW_REQUEST_THRESHOLD) {
    logger.warn('Very slow request detected', metadata);
    captureMessage(`Very slow request: ${method} ${route} (${Math.round(time)}ms)`, 'warning', {
      tags: { type: 'performance', severity: 'high' },
      extra: metadata,
    });
  } else if (time > SLOW_REQUEST_THRESHOLD) {
    logger.warn('Slow request detected', metadata);
  }

  addBreadcrumb({
    category: 'http',
    message: `${method} ${route}`,
    level: statusCode >= 400 ? 'error' : 'info',
    data: { statusCode, duration: Math.round(time) },
  });

  if (process.env.NODE_ENV === 'development') {
    res.setHeader('X-Response-Time', `${Math.round(time)}ms`);
  }
});

const requestTracker = (req, res, next) => {
  req.startTime = Date.now();

  setContext('request', {
    method: req.method,
    path: req.path,
    query: req.query,
    userId: req.user?.id || 'anonymous',
    userAgent: req.get('user-agent'),
  });

  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    const route = req.route?.path || req.path;

    logger.info('Request completed', {
      method: req.method,
      route,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id || 'anonymous',
    });
  });

  next();
};

const errorTracker = (error, req, res, next) => {
  const { captureException } = require('../config/sentry');

  const context = {
    tags: {
      method: req.method,
      path: req.path,
      statusCode: error.status || 500,
    },
    extra: {
      query: req.query,
      body: req.body ? Object.keys(req.body) : [],
      headers: {
        'user-agent': req.get('user-agent'),
        'content-type': req.get('content-type'),
      },
    },
    user: req.user
      ? {
          id: req.user.id,
          email: req.user.email,
        }
      : undefined,
    level: error.status >= 500 ? 'error' : 'warning',
  };

  captureException(error, context);

  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
    userId: req.user?.id || 'anonymous',
  });

  next(error);
};

const metricsCollector = () => {
  const metrics = {
    requests: { total: 0, success: 0, error: 0 },
    responseTimes: [],
    errors: {},
  };

  return {
    middleware: (req, res, next) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        metrics.requests.total++;

        if (res.statusCode < 400) {
          metrics.requests.success++;
        } else {
          metrics.requests.error++;
          const errorKey = `${res.statusCode}`;
          metrics.errors[errorKey] = (metrics.errors[errorKey] || 0) + 1;
        }

        metrics.responseTimes.push(duration);

        if (metrics.responseTimes.length > 1000) {
          metrics.responseTimes.shift();
        }
      });

      next();
    },

    getMetrics: () => {
      const avgResponseTime =
        metrics.responseTimes.length > 0
          ? Math.round(
              metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length,
            )
          : 0;

      const p95ResponseTime =
        metrics.responseTimes.length > 0
          ? Math.round(
              metrics.responseTimes.sort((a, b) => a - b)[
                Math.floor(metrics.responseTimes.length * 0.95)
              ],
            )
          : 0;

      return {
        requests: metrics.requests,
        responseTimes: {
          average: avgResponseTime,
          p95: p95ResponseTime,
          samples: metrics.responseTimes.length,
        },
        errors: metrics.errors,
      };
    },

    reset: () => {
      metrics.requests = { total: 0, success: 0, error: 0 };
      metrics.responseTimes = [];
      metrics.errors = {};
    },
  };
};

module.exports = {
  performanceMonitoring,
  requestTracker,
  errorTracker,
  metricsCollector,
};
