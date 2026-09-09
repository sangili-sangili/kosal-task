const http = require('http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { testConnection, closeConnection } = require('./config/database');
const { initializeDatabase } = require('./database/initDb');
const redisClient = require('./config/redis');
const { initNotificationWorker } = require('./jobs/workers/notificationWorker');

const server = http.createServer(app);

let worker = null;

async function bootstrap() {
  try {
    logger.info('====================================================');
    logger.info('   Bootstrapping Enterprise Application Server...   ');
    logger.info('====================================================');

    // 1. Authenticate Database
    await testConnection();

    // 2. Initialize Database Schema & Seeds
    await initializeDatabase();

    // 3. Initialize BullMQ Queue Worker
    worker = initNotificationWorker();

    // 4. Start HTTP Server
    server.listen(env.PORT, () => {
      logger.info(`Server successfully listening on port ${env.PORT} [Environment: ${env.NODE_ENV}]`);
      logger.info(`Swagger API documentation available at: ${env.APP_URL}/api/docs`);
      logger.info(`Health check probe available at: ${env.APP_URL}/healthz`);
      logger.info(`Ready check probe available at: ${env.APP_URL}/readyz`);
    });
  } catch (error) {
    logger.error('Fatal initialization error during server bootstrap:', error);
    process.exit(1);
  }
}

// Graceful Shutdown Handler (Topic 27)
let isShuttingDown = false;

async function handleShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.warn(`Received ${signal}. Initiating graceful application shutdown...`);

  // Stop accepting new HTTP requests
  server.close(async () => {
    logger.info('HTTP server closed. No longer accepting new connections.');

    try {
      // Close worker
      if (worker) {
        logger.info('Closing BullMQ worker...');
        await worker.close();
      }

      // Close Redis connection
      if (redisClient && typeof redisClient.quit === 'function') {
        logger.info('Disconnecting Redis client...');
        await redisClient.quit();
      }

      // Close Database pool
      logger.info('Closing Sequelize database connection pool...');
      await closeConnection();

      logger.info('Graceful shutdown completed successfully. Exiting process.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during graceful shutdown cleanup:', err);
      process.exit(1);
    }
  });

  // Force termination if graceful cleanup hangs beyond 10 seconds
  setTimeout(() => {
    logger.error('Graceful shutdown timed out (10s). Forcing termination.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection detected:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception detected:', error);
  handleShutdown('UNCAUGHT_EXCEPTION');
});

bootstrap();
