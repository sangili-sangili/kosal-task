const express = require('express');
const { testConnection } = require('../config/database');
const redisClient = require('../config/redis');

const router = express.Router();

router.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

router.get('/readyz', async (req, res) => {
  let dbStatus = 'DOWN';
  let redisStatus = 'DOWN';

  try {
    await testConnection();
    dbStatus = 'UP';
  } catch (e) {
    dbStatus = 'DOWN';
  }

  try {
    const ping = await redisClient.ping();
    if (ping === 'PONG') redisStatus = 'UP';
  } catch (e) {
    redisStatus = 'DOWN';
  }

  const isReady = dbStatus === 'UP';

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'READY' : 'DEGRADED',
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
    timestamp: new Date(),
  });
});

module.exports = router;
