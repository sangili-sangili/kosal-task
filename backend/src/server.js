/**
 * Application HTTP Server Entry Point
 * Handles lifecycle events and graceful shutdown
 */
const http = require('http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { testConnection, closeConnection } = require('./config/database');

const server = http.createServer(app);

async function bootstrap() {
  try {
    logger.info('====================================================');
    logger.info('   Real Estate CRM API Server Initializing...       ');
    logger.info('====================================================');

    // Verify Database Connection
    await testConnection();

    // Ensure Role model is synchronized with database
    const { Role } = require('./models');
    await Role.sync();

    // Start Listening
    server.listen(env.PORT, () => {
      logger.info(`Server successfully running on port ${env.PORT} [Env: ${env.NODE_ENV}]`);
      logger.info(`Health check probe: http://localhost:${env.PORT}/api/v1/health`);
    });
  } catch (error) {
    logger.error('Fatal initialization error during server bootstrap:', error);
    process.exit(1);
  }
}

// Graceful Shutdown Handler
let isShuttingDown = false;

async function handleShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.warn(`Received ${signal}. Initiating graceful application shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed. Terminating open resources...');

    try {
      // Close Sequelize Database Pool
      logger.info('Closing database connection pool...');
      await closeConnection();

      logger.info('Graceful shutdown completed. Process exiting.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during graceful shutdown cleanup:', err);
      process.exit(1);
    }
  });

  // Force termination if cleanup hangs beyond 10 seconds
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

// Run server only when executed directly (not when required in tests)
if (require.main === module) {
  bootstrap();
}

module.exports = {
  server,
  bootstrap,
};
