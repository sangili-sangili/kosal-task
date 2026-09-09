const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  APP_URL: process.env.APP_URL || 'http://localhost:5000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Database
  DB: {
    HOST: process.env.DB_HOST || '127.0.0.1',
    PORT: parseInt(process.env.DB_PORT || '3306', 10),
    NAME: process.env.DB_NAME || 'enterprise_db',
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || 'root_password',
    DIALECT: process.env.DB_DIALECT || 'mysql',
    POOL: {
      MAX: parseInt(process.env.DB_POOL_MAX || '20', 10),
      MIN: parseInt(process.env.DB_POOL_MIN || '5', 10),
      IDLE: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
      ACQUIRE: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
    },
    USE_SQLITE_FALLBACK: process.env.USE_SQLITE_FALLBACK === 'true' || false,
  },

  // JWT Security
  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'default_jwt_access_secret_for_development_min_32_chars!',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret_for_development_min_32_chars!',
    ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '15m',
    REFRESH_EXPIRATION_DAYS: parseInt(process.env.JWT_REFRESH_EXPIRATION_DAYS || '7', 10),
  },

  // Redis
  REDIS: {
    HOST: process.env.REDIS_HOST || '127.0.0.1',
    PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
    PASSWORD: process.env.REDIS_PASSWORD || undefined,
    DB: parseInt(process.env.REDIS_DB || '0', 10),
    ENABLED: process.env.REDIS_ENABLED === 'true' || false,
  },

  // Security
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  // Logging
  LOG: {
    LEVEL: process.env.LOG_LEVEL || 'debug',
    FILE_ENABLED: process.env.LOG_FILE_ENABLED === 'true' || false,
  },
};

module.exports = env;
