const dotenv = require('dotenv');
const path = require('path');
const { z } = require('zod');

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Database Configurations (supporting both DATABASE_* and DB_* conventions)
  DATABASE_HOST: z.string().default('127.0.0.1'),
  DATABASE_PORT: z.coerce.number().default(3306),
  DATABASE_NAME: z.string().default('real_estate_crm'),
  DATABASE_USER: z.string().default('root'),
  DATABASE_PASSWORD: z.string().default(''),
  DATABASE_DIALECT: z.enum(['mysql', 'sqlite', 'postgres']).default('mysql'),
  USE_SQLITE_FALLBACK: z.preprocess(
    (val) => val === 'true' || val === true || val === '1',
    z.boolean()
  ).default(false),

  // Connection Pool Settings
  DATABASE_POOL_MAX: z.coerce.number().default(20),
  DATABASE_POOL_MIN: z.coerce.number().default(5),
  DATABASE_POOL_IDLE: z.coerce.number().default(10000),
  DATABASE_POOL_ACQUIRE: z.coerce.number().default(30000),

  // JWT Authentication Settings
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters').default('enterprise_jwt_access_secret_production_key_32bytes_minimum!'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().default('enterprise_jwt_refresh_secret_production_key_32bytes_minimum!'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Logging & Security
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('debug'),
  LOG_FILE_ENABLED: z.coerce.boolean().default(true),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 mins
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});

const rawEnv = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  CORS_ORIGIN: process.env.CORS_ORIGIN,

  DATABASE_HOST: process.env.DATABASE_HOST || process.env.DB_HOST,
  DATABASE_PORT: process.env.DATABASE_PORT || process.env.DB_PORT,
  DATABASE_NAME: process.env.DATABASE_NAME || process.env.DB_NAME,
  DATABASE_USER: process.env.DATABASE_USER || process.env.DB_USER,
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ?? process.env.DB_PASSWORD,
  DATABASE_DIALECT: process.env.DATABASE_DIALECT || process.env.DB_DIALECT,
  USE_SQLITE_FALLBACK: process.env.USE_SQLITE_FALLBACK,

  DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX || process.env.DB_POOL_MAX,
  DATABASE_POOL_MIN: process.env.DATABASE_POOL_MIN || process.env.DB_POOL_MIN,
  DATABASE_POOL_IDLE: process.env.DATABASE_POOL_IDLE || process.env.DB_POOL_IDLE,
  DATABASE_POOL_ACQUIRE: process.env.DATABASE_POOL_ACQUIRE || process.env.DB_POOL_ACQUIRE,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_ACCESS_EXPIRATION,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || process.env.JWT_REFRESH_EXPIRATION_DAYS,

  LOG_LEVEL: process.env.LOG_LEVEL,
  LOG_FILE_ENABLED: process.env.LOG_FILE_ENABLED,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
};

const parseResult = envSchema.safeParse(rawEnv);

if (!parseResult.success) {
  console.error('❌ Environment configuration validation failed:');
  console.error(JSON.stringify(parseResult.error.format(), null, 2));
  process.exit(1);
}

const validated = parseResult.data;

const env = {
  NODE_ENV: validated.NODE_ENV,
  PORT: validated.PORT,
  CORS_ORIGIN: validated.CORS_ORIGIN,

  // Database settings
  DB: {
    HOST: validated.DATABASE_HOST,
    PORT: validated.DATABASE_PORT,
    NAME: validated.DATABASE_NAME,
    USER: validated.DATABASE_USER,
    PASSWORD: validated.DATABASE_PASSWORD,
    DIALECT: validated.DATABASE_DIALECT,
    USE_SQLITE_FALLBACK: validated.USE_SQLITE_FALLBACK,
    POOL: {
      MAX: validated.DATABASE_POOL_MAX,
      MIN: validated.DATABASE_POOL_MIN,
      IDLE: validated.DATABASE_POOL_IDLE,
      ACQUIRE: validated.DATABASE_POOL_ACQUIRE,
    },
  },

  // JWT Security settings
  JWT: {
    ACCESS_SECRET: validated.JWT_ACCESS_SECRET,
    ACCESS_EXPIRES_IN: validated.JWT_ACCESS_EXPIRES_IN,
    REFRESH_SECRET: validated.JWT_REFRESH_SECRET,
    REFRESH_EXPIRES_IN: validated.JWT_REFRESH_EXPIRES_IN,
  },

  // Security
  SECURITY: {
    RATE_LIMIT_WINDOW_MS: validated.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX: validated.RATE_LIMIT_MAX,
  },

  // Logging
  LOG: {
    LEVEL: validated.LOG_LEVEL,
    FILE_ENABLED: validated.LOG_FILE_ENABLED,
  },
};

module.exports = env;
