const cacheService = require('../services/cache.service.js');

/**
 * Redis Cache Middleware for API responses
 * Caches GET requests to reduce database load and improve performance
 */

// Cache middleware for API responses
const cacheMiddleware = (ttl = 3600) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for authenticated routes that return user-specific data
    const skipCacheRoutes = [
      '/auth/profile',
      '/auth/check',
      '/notifications',
      '/support/my-tickets',
    ];

    const shouldSkipCache = skipCacheRoutes.some((route) => req.path.includes(route));
    if (shouldSkipCache) {
      return next();
    }

    try {
      // Generate cache key from endpoint and query parameters
      const endpoint = req.path;
      const params = { ...req.query, ...req.params };

      // Check cache first
      const cachedResponse = await cacheService.getCachedAPIResponse(endpoint, params);
      if (cachedResponse) {
        return res.json(cachedResponse);
      }

      // If no cache, intercept the response to cache it
      const originalSend = res.json;
      res.json = function (data) {
        // Only cache successful responses
        if (res.statusCode === 200 && data) {
          cacheService.cacheAPIResponse(endpoint, params, data, ttl).catch((_error) => {
            /* Cache write failed */
          });
        }

        // Call original send method
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      next();
    }
  };
};

// Cache middleware for batch/analytics data (longer TTL)
const longCacheMiddleware = cacheMiddleware(7200); // 2 hours

// Cache middleware for user data (shorter TTL)
const shortCacheMiddleware = cacheMiddleware(1800); // 30 minutes

// Cache invalidation middleware for POST/PUT/DELETE requests
const cacheInvalidationMiddleware = (patterns = []) => {
  return async (req, res, next) => {
    // Only invalidate on data-changing operations
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return next();
    }

    // Intercept response to invalidate cache after successful operations
    const originalSend = res.json;
    res.json = function (data) {
      // Only invalidate on successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Default patterns based on route
        const defaultPatterns = [`api:${req.baseUrl}*`, `api:${req.path}*`];

        const allPatterns = [...defaultPatterns, ...patterns];

        // Invalidate cache patterns
        allPatterns.forEach((pattern) => {
          cacheService.clearCache(pattern).catch((_error) => {
            /* Cache invalidation failed */
          });
        });
      }

      // Call original send method
      originalSend.call(this, data);
    };

    next();
  };
};

// Session cache middleware
const sessionCacheMiddleware = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return next();
  }

  try {
    // Try to get cached session data
    const cachedSession = await cacheService.getCachedUserSession(req.user.id);
    if (cachedSession) {
      req.cachedUser = cachedSession;
    }

    // Intercept response to cache updated session data
    const originalSend = res.json;
    res.json = function (data) {
      // Cache user session data if response contains user info
      if (data && data.user && res.statusCode === 200) {
        cacheService
          .cacheUserSession(req.user.id, data.user, 604800) // 7 days
          .catch((_error) => {
            /* Session cache failed */
          });
      }

      originalSend.call(this, data);
    };

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  cacheMiddleware,
  longCacheMiddleware,
  shortCacheMiddleware,
  cacheInvalidationMiddleware,
  sessionCacheMiddleware,
};
