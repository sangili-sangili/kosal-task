const dashboardService = require('../services/dashboard.service');
const { sendSuccess } = require('../utils/response');

class DashboardController {
  /**
   * Retrieve CRM dashboard metrics
   * GET /api/v1/dashboard/metrics
   */
  async getMetrics(req, res, next) {
    try {
      const metrics = await dashboardService.getMetrics(req.user);
      return sendSuccess(res, 'Dashboard metrics retrieved successfully', metrics);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new DashboardController();
