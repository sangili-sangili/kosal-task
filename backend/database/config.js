const env = require('../src/config/env');

module.exports = {
  development: {
    username: env.DB.USER,
    password: env.DB.PASSWORD,
    database: env.DB.NAME,
    host: env.DB.HOST,
    port: env.DB.PORT,
    dialect: env.DB.DIALECT,
    pool: env.DB.POOL,
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
