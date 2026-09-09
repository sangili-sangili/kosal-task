const path = require('path');
const env = require('../src/config/env');

const isSqlite = env.DB.DIALECT === 'sqlite' || env.DB.USE_SQLITE_FALLBACK;
const sqliteStorage = path.resolve(__dirname, 'real_estate_crm.sqlite');

module.exports = {
  development: isSqlite
    ? {
        dialect: 'sqlite',
        storage: sqliteStorage,
        logging: false,
      }
    : {
        username: env.DB.USER,
        password: env.DB.PASSWORD,
        database: env.DB.NAME,
        host: env.DB.HOST,
        port: env.DB.PORT,
        dialect: 'mysql',
        pool: env.DB.POOL,
        logging: false,
      },
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  production: {
    username: env.DB.USER,
    password: env.DB.PASSWORD,
    database: env.DB.NAME,
    host: env.DB.HOST,
    port: env.DB.PORT,
    dialect: 'mysql',
    pool: env.DB.POOL,
    logging: false,
  },
};
