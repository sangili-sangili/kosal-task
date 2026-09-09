import api from './api';

export const dashboardService = {
  /**
   * Fetch aggregated dashboard KPIs, metrics, charts, and activity data (scoped by user role)
   * @returns {Promise<Object>}
   */
  getMetrics: async () => {
    const res = await api.get('/dashboard/metrics');
    if (
      res &&
      typeof res === 'object' &&
      'data' in res &&
      res.data &&
      typeof res.data === 'object' &&
      ('leads' in res.data || 'inventory' in res.data)
    ) {
      return res.data;
    }
    return res;
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
