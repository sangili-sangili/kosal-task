const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const env = require('./env');
const logger = require('./logger');

let sequelize;

function initSequelize() {
  const isMysql = env.DB.DIALECT === 'mysql';

  if (isMysql && !env.DB.USE_SQLITE_FALLBACK) {
    sequelize = new Sequelize(env.DB.NAME, env.DB.USER, env.DB.PASSWORD, {
      host: env.DB.HOST,
      port: env.DB.PORT,
      dialect: 'mysql',
      pool: {
        max: env.DB.POOL.MAX,
        min: env.DB.POOL.MIN,
        idle: env.DB.POOL.IDLE,
        acquire: env.DB.POOL.ACQUIRE,
      },
      logging: (msg) => logger.debug(msg),
      define: {
        timestamps: true,
        underscored: true,
        paranoid: true, // Soft delete enabled by default
      },
      dialectOptions: {
        connectTimeout: 10000,
      },
    });
  } else {
    // Resilient SQLite configuration for development & automated tests
    const dbDir = path.resolve(__dirname, '../../database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const storagePath = path.join(dbDir, 'real_estate_crm.sqlite');

    logger.info(`Configured SQLite database pool at: ${storagePath} [Development/Testing Mode]`);
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: storagePath,
      logging: (msg) => logger.debug(msg),
      pool: {
        max: env.DB.POOL.MAX,
        min: env.DB.POOL.MIN,
        idle: env.DB.POOL.IDLE,
        acquire: env.DB.POOL.ACQUIRE,
      },
      define: {
        timestamps: true,
        underscored: true,
        paranoid: true,
      },
    });
  }

  return sequelize;
}

sequelize = initSequelize();

async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info(`Database connection established successfully. [Dialect: ${sequelize.getDialect()}]`);
    return true;
  } catch (error) {
    logger.error(`Unable to connect to the database (${sequelize.getDialect()}): ${error.message}`);
    // If MySQL connection failed and fallback was not active, trigger SQLite fallback automatically
    if (env.DB.DIALECT === 'mysql' && !env.DB.USE_SQLITE_FALLBACK) {
      logger.warn('Attempting SQLite fallback for local development resilience...');
      env.DB.USE_SQLITE_FALLBACK = true;
      sequelize = initSequelize();
      await sequelize.authenticate();
      logger.info('Database connection established successfully via SQLite fallback.');
      return true;
    }
    throw error;
  }
}

async function closeConnection() {
  try {
    if (sequelize) {
      await sequelize.close();
      logger.info('Sequelize database connection pool closed cleanly.');
    }
  } catch (error) {
    logger.error('Error while closing database connection pool:', error);
  }
}

module.exports = {
  sequelize,
  testConnection,
  closeConnection,
};
