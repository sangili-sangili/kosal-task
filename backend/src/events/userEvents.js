const appEvents = require('./eventEmitter');
const { dispatchJob } = require('../jobs/queues/notificationQueue');
const logger = require('../config/logger');

function registerUserEvents() {
  appEvents.on('user:registered', async (user) => {
    logger.info(`Event [user:registered] triggered for ${user.email}`);
    await dispatchJob('sendWelcomeNotification', {
      userId: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
    });
  });

  appEvents.on('user:login', async ({ user, ipAddress }) => {
    logger.info(`Event [user:login] recorded for user ${user.id} from IP ${ipAddress}`);
  });

  appEvents.on('security:token_reuse_detected', async ({ userId, ipAddress }) => {
    logger.error(`CRITICAL SECURITY EVENT: Refresh token reuse detected for user ${userId} from ${ipAddress}!`);
    await dispatchJob('sendSecurityAlert', {
      userId,
      message: 'Suspicious login activity detected: compromised session token revoked.',
    });
  });
}

module.exports = {
  registerUserEvents,
};
