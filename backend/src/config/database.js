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
        paranoid: true, // Enable soft deletes by default
      },
    });
  } else {
    // Development or SQLite fallback
    const dbDir = path.resolve(__dirname, '../../database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const storagePath = path.join(dbDir, 'dev.sqlite');

    logger.info(`Using SQLite database at ${storagePath} for local development/testing.`);
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: storagePath,
      logging: (msg) => logger.debug(msg),
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
    logger.error('Unable to connect to the database:', error);
    // If MySQL failed and fallback wasn't already triggered, attempt fallback
    if (env.DB.DIALECT === 'mysql' && !env.DB.USE_SQLITE_FALLBACK) {
      logger.warn('Attempting SQLite fallback for local development...');
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
    await sequelize.close();
    logger.info('Database connection closed cleanly.');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
}

module.exports = {
  sequelize,
  testConnection,
  closeConnection,
};
