const redisClient = require('../config/redis');
const logger = require('../config/logger');

class CacheService {
  /**
   * Helper to retrieve or populate cache with jitter
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Async function to fetch data if cache miss
   * @param {number} ttlSeconds - Time-to-live in seconds (default: 3600)
   */
  async wrap(key, fetchFn, ttlSeconds = 3600) {
    try {
      const cached = await this.get(key);
      if (cached !== null) {
        return cached;
      }
    } catch (err) {
      logger.warn(`Cache read error for key ${key}: ${err.message}`);
    }

    const data = await fetchFn();

    if (data !== undefined && data !== null) {
      // Add random jitter (±10%) to prevent cache stampede
      const jitter = Math.floor(ttlSeconds * 0.1 * (Math.random() * 2 - 1));
      const finalTtl = Math.max(60, ttlSeconds + jitter);
      this.set(key, data, finalTtl).catch((err) => {
        logger.warn(`Cache write error for key ${key}: ${err.message}`);
      });
    }

    return data;
  }

  async get(key) {
    try {
      const raw = await redisClient.get(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      logger.warn(`Redis get failed: ${err.message}`);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await redisClient.setex(key, ttlSeconds, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
      return true;
    } catch (err) {
      logger.warn(`Redis set failed: ${err.message}`);
      return false;
    }
  }

  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (err) {
      logger.warn(`Redis del failed: ${err.message}`);
      return false;
    }
  }

  async delPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys && keys.length > 0) {
        await redisClient.del(...keys);
      }
      return true;
    } catch (err) {
      logger.warn(`Redis delPattern failed: ${err.message}`);
      return false;
    }
  }
}

module.exports = new CacheService();
