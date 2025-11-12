/**
 * Caching Utility
 * Provides Redis-backed caching with in-memory fallback
 */

const Redis = require('ioredis');

let redisClient = null;
let isRedisAvailable = false;
const memoryCache = new Map();

// Memory cache TTL tracking
const cacheTTLs = new Map();

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

      redisClient.on('error', () => {
        isRedisAvailable = false;
      });
    } catch (error) {
      isRedisAvailable = false;
    }
  }
};

initRedis();

/**
 * Set cache value
 */
const set = async (key, value, ttlSeconds = 3600) => {
  const serialized = JSON.stringify(value);

  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      isRedisAvailable = false;
    }
  }

  // Fallback to memory cache
  memoryCache.set(key, serialized);
  cacheTTLs.set(key, Date.now() + ttlSeconds * 1000);

  return true;
};

/**
 * Get cache value
 */
const get = async (key) => {
  if (isRedisAvailable && redisClient) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      isRedisAvailable = false;
    }
  }

  // Fallback to memory cache
  const ttl = cacheTTLs.get(key);
  if (ttl && Date.now() > ttl) {
    memoryCache.delete(key);
    cacheTTLs.delete(key);
    return null;
  }

  const value = memoryCache.get(key);
  return value ? JSON.parse(value) : null;
};

/**
 * Delete cache value
 */
const del = async (key) => {
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.del(key);
    } catch (error) {
      isRedisAvailable = false;
    }
  }

  memoryCache.delete(key);
  cacheTTLs.delete(key);
  return true;
};

/**
 * Delete multiple cache keys by pattern
 */
const delPattern = async (pattern) => {
  if (isRedisAvailable && redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      isRedisAvailable = false;
    }
  }

  // Memory cache pattern deletion
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern.replace('*', ''))) {
      memoryCache.delete(key);
      cacheTTLs.delete(key);
    }
  }

  return true;
};

/**
 * Check if key exists
 */
const exists = async (key) => {
  if (isRedisAvailable && redisClient) {
    try {
      return (await redisClient.exists(key)) === 1;
    } catch (error) {
      isRedisAvailable = false;
    }
  }

  return memoryCache.has(key);
};

/**
 * Cache wrapper for functions
 */
const cached = (keyGenerator, ttlSeconds = 3600) => {
  return (fn) => {
    return async (...args) => {
      const key = typeof keyGenerator === 'function' ? keyGenerator(...args) : keyGenerator;

      // Try to get from cache
      const cachedValue = await get(key);
      if (cachedValue !== null) {
        return cachedValue;
      }

      // Execute function and cache result
      const result = await fn(...args);
      await set(key, result, ttlSeconds);

      return result;
    };
  };
};

/**
 * Invalidate cache by tags
 */
const invalidateTags = async (tags) => {
  const tagArray = Array.isArray(tags) ? tags : [tags];

  for (const tag of tagArray) {
    await delPattern(`*:${tag}:*`);
  }
};

/**
 * Clear all cache
 */
const clear = async () => {
  if (isRedisAvailable && redisClient) {
    try {
      await redisClient.flushdb();
    } catch (error) {
      isRedisAvailable = false;
    }
  }

  memoryCache.clear();
  cacheTTLs.clear();
};

/**
 * Get cache statistics
 */
const stats = () => {
  return {
    redisAvailable: isRedisAvailable,
    memoryKeys: memoryCache.size,
    backend: isRedisAvailable ? 'redis' : 'memory',
  };
};

// Cleanup expired memory cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, ttl] of cacheTTLs.entries()) {
    if (now > ttl) {
      memoryCache.delete(key);
      cacheTTLs.delete(key);
    }
  }
}, 60000); // Every minute

// Cleanup on shutdown
const cleanup = async () => {
  if (redisClient) {
    await redisClient.quit();
  }
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

module.exports = {
  set,
  get,
  del,
  delPattern,
  exists,
  cached,
  invalidateTags,
  clear,
  stats,
  isRedisAvailable: () => isRedisAvailable,
};
