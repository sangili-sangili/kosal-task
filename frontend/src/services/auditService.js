import api from './api';

export const auditService = {
  /**
   * GET /audit — paginated list with optional filters and live stats
   */
  getAuditLogs: async (params = {}) => {
    const res = await api.get('/audit', { params });
    return res.data ?? res;
  },

  /**
   * GET /audit/stats — KPI metrics summary
   */
  getAuditStats: async () => {
    const res = await api.get('/audit/stats');
    return res.data ?? res;
  },

  /**
   * GET /audit/:id — single log record
   */
  getAuditLogById: async (id) => {
    const res = await api.get(`/audit/${id}`);
    return res.data ?? res;
  },

  /**
   * POST /audit — manually record an audit event
   */
  createAuditLog: async (data) => {
    const res = await api.post('/audit', data);
    return res.data ?? res;
  },
};

export default auditService;
