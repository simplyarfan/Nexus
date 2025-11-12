/**
 * HTTP Caching Middleware
 * Provides request-level caching for API endpoints
 */

const cache = require('../utils/cache');

/**
 * Cache middleware factory
 * @param {Number} ttlSeconds - Cache TTL in seconds
 * @param {Function} keyGenerator - Function to generate cache key from request
 */
const cacheMiddleware = (ttlSeconds = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : `cache:${req.originalUrl}:${req.user?.id || 'anonymous'}`;

    try {
      // Check cache
      const cachedResponse = await cache.get(cacheKey);

      if (cachedResponse) {
        // Set cache header
        res.set('X-Cache', 'HIT');
        return res.json(cachedResponse);
      }

      // Cache miss - intercept response
      res.set('X-Cache', 'MISS');

      const originalJson = res.json.bind(res);
      res.json = function (data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, data, ttlSeconds).catch(() => {});
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      next();
    }
  };
};

/**
 * Cache middleware for user-specific data
 */
const userCacheMiddleware = (ttlSeconds = 300) => {
  return cacheMiddleware(ttlSeconds, (req) => {
    return `cache:user:${req.user?.id}:${req.path}`;
  });
};

/**
 * Cache middleware for public data
 */
const publicCacheMiddleware = (ttlSeconds = 600) => {
  return cacheMiddleware(ttlSeconds, (req) => {
    return `cache:public:${req.path}:${JSON.stringify(req.query)}`;
  });
};

/**
 * Invalidate cache by pattern
 */
const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    try {
      await cache.delPattern(pattern);
      next();
    } catch (error) {
      next();
    }
  };
};

/**
 * Invalidate user cache on mutation
 */
const invalidateUserCache = async (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.user) {
    await cache.delPattern(`cache:user:${req.user.id}:*`);
  }
  next();
};

module.exports = {
  cacheMiddleware,
  userCacheMiddleware,
  publicCacheMiddleware,
  invalidateCache,
  invalidateUserCache,
};
