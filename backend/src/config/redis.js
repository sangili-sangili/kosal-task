const Redis = require('ioredis');
const logger = require('./logger');
const env = require('./env');

let redisClient = null;

// In-memory fallback if Redis is disabled or unavailable
class InMemoryCacheFallback {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
  }

  async get(key) {
    const expiresAt = this.ttls.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      this.store.delete(key);
      this.ttls.delete(key);
      return null;
    }
    return this.store.get(key) || null;
  }

  async set(key, value) {
    this.store.set(key, value);
    return 'OK';
  }

  async setex(key, seconds, value) {
    this.store.set(key, value);
    this.ttls.set(key, Date.now() + seconds * 1000);
    return 'OK';
  }

  async del(...keys) {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) {
        this.ttls.delete(key);
        count++;
      }
    }
    return count;
  }

  async keys(pattern) {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
    const matching = [];
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        const expiresAt = this.ttls.get(key);
        if (!expiresAt || Date.now() <= expiresAt) {
          matching.push(key);
        }
      }
    }
    return matching;
  }

  async ping() {
    return 'PONG';
  }

  async quit() {
    this.store.clear();
    this.ttls.clear();
    return 'OK';
  }
}

if (env.REDIS.ENABLED) {
  try {
    redisClient = new Redis({
      host: env.REDIS.HOST,
      port: env.REDIS.PORT,
      password: env.REDIS.PASSWORD,
      db: env.REDIS.DB,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) {
          logger.warn('Redis reconnection retries exhausted. Falling back to in-memory cache.');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis server successfully.');
    });

    redisClient.on('error', (err) => {
      logger.warn(`Redis connection error: ${err.message}. Graceful fallback active.`);
    });
  } catch (err) {
    logger.warn(`Failed to initialize Redis client: ${err.message}. Using in-memory fallback.`);
    redisClient = new InMemoryCacheFallback();
  }
} else {
  logger.info('Redis is disabled in environment config. Initializing in-memory cache fallback.');
  redisClient = new InMemoryCacheFallback();
}

module.exports = redisClient;
