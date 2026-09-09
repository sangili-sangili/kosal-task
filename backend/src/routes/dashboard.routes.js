const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

/**
 * @route   GET /api/v1/dashboard/metrics
 * @desc    Get aggregated dashboard KPIs and metrics (scoped by role)
 * @access  Private (ADMIN, SALES)
 */
router.get('/metrics', (req, res, next) => {
  return dashboardController.getMetrics(req, res, next);
});

module.exports = router;
