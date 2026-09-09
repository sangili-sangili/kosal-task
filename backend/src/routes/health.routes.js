/**
 * Health Check Routes
 */
const express = require('express');
const { sendSuccess } = require('../utils/response');
const { testConnection } = require('../config/database');

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    API Health Status probe
 * @access  Public
 */
router.get('/health', async (req, res, next) => {
  try {
    let dbStatus = 'UP';
    try {
      await testConnection();
    } catch (dbErr) {
      dbStatus = 'DOWN';
    }

    return sendSuccess(res, 'API is healthy', {
      status: 'UP',
      database: dbStatus,
      uptime: `${Math.floor(process.uptime())}s`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
