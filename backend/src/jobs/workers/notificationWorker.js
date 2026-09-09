const { Worker } = require('bullmq');
const env = require('../../config/env');
const logger = require('../../config/logger');

let worker = null;

function initNotificationWorker() {
  if (!env.REDIS.ENABLED) {
    logger.info('BullMQ worker disabled (REDIS_ENABLED is false).');
    return null;
  }

  try {
    worker = new Worker(
      'notificationQueue',
      async (job) => {
        logger.info(`[BullMQ Worker] Processing job ${job.id} of type ${job.name}...`);

        switch (job.name) {
          case 'sendWelcomeNotification':
            // Emulate sending welcome email/SMS
            logger.info(`Sending welcome email to recipient: ${job.data.email}`);
            break;

          case 'sendSecurityAlert':
            logger.info(`Sending security alert to user ${job.data.userId}: ${job.data.message}`);
            break;

          case 'logAuditEvent':
            logger.info(`Recording asynchronous audit entry for ${job.data.entity}: ${job.data.action}`);
            break;

          default:
            logger.warn(`Unknown job type received: ${job.name}`);
        }

        return { success: true, processedAt: new Date() };
      },
      {
        connection: {
          host: env.REDIS.HOST,
          port: env.REDIS.PORT,
          password: env.REDIS.PASSWORD,
          db: env.REDIS.DB,
        },
        concurrency: 5,
      }
    );

    worker.on('completed', (job) => {
      logger.info(`[BullMQ Worker] Job ${job.id} (${job.name}) completed successfully.`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`[BullMQ Worker] Job ${job?.id} (${job?.name}) failed: ${err.message}`);
    });

    logger.info('BullMQ notification worker initialized and listening for jobs.');
    return worker;
  } catch (err) {
    logger.warn(`Failed to initialize BullMQ Worker: ${err.message}`);
    return null;
  }
}

module.exports = {
  initNotificationWorker,
};
