const Redis = require('ioredis');

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
  }

  async connect() {
    if (this.isConnected && this.redis) {
      return this.redis;
    }

    try {
      // Check if Redis URL is configured
      const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

      if (!redisUrl) {
        return null;
      }

      // Create Redis connection
      this.redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        // Handle connection errors gracefully
        retryDelayOnClusterDown: 300,
        enableAutoPipelining: true,
      });

      // Test connection
      await this.redis.ping();
      this.isConnected = true;

      // Handle connection events
      this.redis.on('error', (_error) => {
        this.isConnected = false;
      });

      return this.redis;
    } catch (error) {
      this.isConnected = false;
      return null;
    }
  }

  // Cache CV analysis results (24h TTL)
  async cacheCVAnalysis(key, analysisResult, ttl = 86400) {
    try {
      if (!this.redis || !this.isConnected) {
        await this.connect();
        if (!this.redis) {
          return false;
        }
      }

      const cacheKey = `cv_analysis:${key}`;
      await this.redis.setex(cacheKey, ttl, JSON.stringify(analysisResult));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get cached CV analysis
  async getCachedCVAnalysis(key) {
    try {
      if (!this.redis || !this.isConnected) {
        await this.connect();
        if (!this.redis) {
          return null;
        }
      }

      const cacheKey = `cv_analysis:${key}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Cache API responses (1h TTL)
  async cacheAPIResponse(endpoint, params, response, ttl = 3600) {
    try {
      if (!this.redis || !this.isConnected) {
        await this.connect();
        if (!this.redis) {
          return false;
        }
      }

      const cacheKey = `api:${endpoint}:${this.hashParams(params)}`;
      await this.redis.setex(cacheKey, ttl, JSON.stringify(response));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get cached API response
  async getCachedAPIResponse(endpoint, params) {
    try {
      if (!this.redis || !this.isConnected) {
        await this.connect();
        if (!this.redis) {
          return null;
        }
      }

      const cacheKey = `api:${endpoint}:${this.hashParams(params)}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  // Cache user sessions (7d TTL)
  async cacheUserSession(userId, sessionData, ttl = 604800) {
    try {
      if (!this.redis || !this.isConnected) {
        await this.connect();
        if (!this.redis) {
          return false;
        }
      }

      const cacheKey = `session:${userId}`;
      await this.redis.setex(cacheKey, ttl, JSON.stringify(sessionData));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get cached user session
  async getCachedUserSession(userId) {
    try {
      if (!this.redis || !this.isConnected) {
        await this.connect();
        if (!this.redis) {
          return null;
        }
      }

      const cacheKey = `session:${userId}`;
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }

  // Clear cache by pattern
  async clearCache(pattern) {
    try {
      if (!this.redis || !this.isConnected) {
        await this.connect();
        if (!this.redis) {
          return false;
        }
      }

      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get cache statistics
  async getCacheStats() {
    try {
      if (!this.redis || !this.isConnected) {
        await this.connect();
        if (!this.redis) {
          return null;
        }
      }

      const info = await this.redis.info('memory');
      const keyCount = await this.redis.dbsize();

      return {
        connected: this.isConnected,
        keyCount,
        memoryInfo: info,
      };
    } catch (error) {
      return null;
    }
  }

  // Generic get method for compatibility
  async get(key) {
    try {
      if (!this.redis || !this.isConnected) {
        await this.connect();
        if (!this.redis) {
          return null;
        }
      }

      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }

  // Generic set method for compatibility
  async set(key, value, ttl = 3600) {
    try {
      if (!this.redis || !this.isConnected) {
        await this.connect();
        if (!this.redis) {
          return false;
        }
      }

      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Helper function to hash parameters for consistent cache keys
  hashParams(params) {
    if (!params) {
      return 'no-params';
    }

    const crypto = require('crypto');
    const paramString = typeof params === 'string' ? params : JSON.stringify(params);
    return crypto.createHash('md5').update(paramString).digest('hex').substring(0, 8);
  }

  // Graceful disconnect
  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
    }
  }
}

// Export singleton instance
const cacheService = new CacheService();
module.exports = cacheService;
