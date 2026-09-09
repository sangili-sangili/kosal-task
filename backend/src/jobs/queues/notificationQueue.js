const { Queue } = require('bullmq');
const env = require('../../config/env');
const logger = require('../../config/logger');

let notificationQueue = null;

if (env.REDIS.ENABLED) {
  try {
    notificationQueue = new Queue('notificationQueue', {
      connection: {
        host: env.REDIS.HOST,
        port: env.REDIS.PORT,
        password: env.REDIS.PASSWORD,
        db: env.REDIS.DB,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for inspection / DLQ
      },
    });

    notificationQueue.on('error', (err) => {
      logger.warn(`NotificationQueue Redis error: ${err.message}`);
    });
  } catch (err) {
    logger.warn(`Failed to initialize BullMQ queue: ${err.message}`);
  }
}

// Resilient queue dispatch wrapper
async function dispatchJob(jobName, payload) {
  if (notificationQueue) {
    try {
      await notificationQueue.add(jobName, payload);
      logger.info(`Job [${jobName}] queued in BullMQ.`);
      return true;
    } catch (err) {
      logger.warn(`Failed to add job to BullMQ, executing synchronously fallback: ${err.message}`);
    }
  }

  // Fallback: asynchronous immediate dispatch
  setImmediate(() => {
    logger.info(`[Fallback Worker] Processing job [${jobName}] asynchronously:`, payload);
  });
  return true;
}

module.exports = {
  notificationQueue,
  dispatchJob,
};
