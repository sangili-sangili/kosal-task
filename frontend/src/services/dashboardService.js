import api from './api';

export const dashboardService = {
  /**
   * Fetch aggregated dashboard KPIs, metrics, charts, and activity data (scoped by user role)
   * @returns {Promise<Object>}
   */
  getMetrics: async () => {
    return api.get('/dashboard/metrics');
  },

  /**
   * Complete a scheduled follow-up activity
   * @param {number|string} leadId
   * @param {number|string} followupId
   * @param {string} [remarks]
   * @returns {Promise<Object>}
   */
  completeFollowup: async (leadId, followupId, remarks = 'Follow-up completed from Dashboard') => {
    return api.patch(`/leads/${leadId}/followups/${followupId}`, {
      status: 'COMPLETED',
      remarks,
    });
  },
};

export default dashboardService;
