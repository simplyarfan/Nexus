/**
 * Redis-based Rate Limiting
 * Provides distributed rate limiting for production/scaled deployments
 * Falls back to in-memory rate limiting if Redis unavailable
 */

const Redis = require('ioredis');
const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');

let redisClient = null;
let isRedisAvailable = false;

// Initialize Redis connection
const initRedis = () => {
  if (process.env.REDIS_URL) {
    try {
      redisClient = new Redis(process.env.REDIS_URL, {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });

      redisClient.on('connect', () => {
        isRedisAvailable = true;
      });

      redisClient.on('error', (err) => {
        isRedisAvailable = false;
      });
    } catch (error) {
      isRedisAvailable = false;
    }
  }
};

// Initialize on module load
initRedis();

/**
 * Create rate limiter (Redis or Memory fallback)
 */
const createRateLimiter = (options) => {
  const { points, duration, blockDuration = 0, keyPrefix = 'rl' } = options;

  if (isRedisAvailable && redisClient) {
    return new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix,
      points,
      duration,
      blockDuration,
    });
  }

  // Fallback to in-memory
  return new RateLimiterMemory({
    keyPrefix,
    points,
    duration,
    blockDuration,
  });
};

/**
 * Authentication rate limiter
 * 5 attempts per 15 minutes
 */
const authRateLimiter = createRateLimiter({
  points: 5,
  duration: 15 * 60,
  blockDuration: 15 * 60,
  keyPrefix: 'auth',
});

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
const generalRateLimiter = createRateLimiter({
  points: 100,
  duration: 15 * 60,
  keyPrefix: 'api',
});

/**
 * Password reset rate limiter
 * 3 attempts per hour
 */
const passwordResetRateLimiter = createRateLimiter({
  points: 3,
  duration: 60 * 60,
  blockDuration: 60 * 60,
  keyPrefix: 'pwd_reset',
});

/**
 * Email verification rate limiter
 * 3 attempts per 5 minutes
 */
const emailVerifyRateLimiter = createRateLimiter({
  points: 3,
  duration: 5 * 60,
  blockDuration: 5 * 60,
  keyPrefix: 'email_verify',
});

/**
 * Middleware factory for rate limiting
 */
const rateLimitMiddleware = (limiter, keyGenerator = (req) => req.ip) => {
  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      await limiter.consume(key);
      next();
    } catch (rejRes) {
      const retryAfter = Math.ceil(rejRes.msBeforeNext / 1000) || 1;

      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        retryAfter,
      });
    }
  };
};

/**
 * IP-based rate limiting middleware
 */
const ipRateLimitMiddleware = (limiter) => {
  return rateLimitMiddleware(limiter, (req) => req.ip);
};

/**
 * User-based rate limiting middleware
 */
const userRateLimitMiddleware = (limiter) => {
  return rateLimitMiddleware(limiter, (req) => {
    return req.user?.id ? `user:${req.user.id}` : req.ip;
  });
};

/**
 * Endpoint-based rate limiting
 */
const endpointRateLimitMiddleware = (limiter) => {
  return rateLimitMiddleware(limiter, (req) => {
    return `${req.ip}:${req.path}`;
  });
};

// Cleanup on shutdown
const cleanup = async () => {
  if (redisClient) {
    await redisClient.quit();
  }
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

module.exports = {
  authRateLimiter,
  generalRateLimiter,
  passwordResetRateLimiter,
  emailVerifyRateLimiter,
  rateLimitMiddleware,
  ipRateLimitMiddleware,
  userRateLimitMiddleware,
  endpointRateLimitMiddleware,
  createRateLimiter,
  isRedisAvailable: () => isRedisAvailable,
};
