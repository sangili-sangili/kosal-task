import api from './api';

export const leadService = {
  /**
   * Fetch paginated leads with filtering, search, and sorting
   * @param {Object} [params]
   * @returns {Promise<Object>}
   */
  getLeads: async (params = {}) => {
    const res = await api.get('/leads', { params });
    if (res && res.data && Array.isArray(res.data)) {
      return {
        leads: res.data,
        pagination: res.pagination || { total: res.data.length, page: 1, limit: 20, totalPages: 1 },
      };
    }
    if (Array.isArray(res)) {
      return {
        leads: res,
        pagination: { total: res.length, page: 1, limit: 20, totalPages: 1 },
      };
    }
    return {
      leads: res?.leads || [],
      pagination: res?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },

  /**
   * Get single lead profile details by ID
   * @param {string|number} id
   * @returns {Promise<Object>}
   */
  getLeadById: async (id) => {
    const res = await api.get(`/leads/${id}`);
    return res?.lead || res;
  },

  /**
   * Create a new prospective lead
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  createLead: async (data) => {
    const res = await api.post('/leads', data);
    return res?.lead || res;
  },

  /**
   * Update lead details
   * @param {string|number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  updateLead: async (id, data) => {
    const res = await api.patch(`/leads/${id}`, data);
    return res?.lead || res;
  },

  /**
   * Update pipeline stage for a lead
   * @param {string|number} id
   * @param {string} stage
   * @returns {Promise<Object>}
   */
  updateLeadStage: async (id, stage) => {
    const res = await api.patch(`/leads/${id}/stage`, { stage });
    return res?.lead || res;
  },

  /**
   * Soft-delete a lead (Admin only)
   * @param {string|number} id
   * @returns {Promise<Object>}
   */
  deleteLead: async (id) => {
    return api.delete(`/leads/${id}`);
  },

  /**
   * Get notes thread for a lead
   * @param {string|number} leadId
   * @returns {Promise<Array>}
   */
  getNotes: async (leadId) => {
    const res = await api.get(`/leads/${leadId}/notes`);
    return res?.notes || (Array.isArray(res) ? res : []);
  },

  /**
   * Add a note to a lead prospect
   * @param {string|number} leadId
   * @param {string} content
   * @returns {Promise<Object>}
   */
  addNote: async (leadId, content) => {
    const res = await api.post(`/leads/${leadId}/notes`, { note: content });
    return res?.note || res;
  },

  /**
   * Get scheduled follow-ups for a lead
   * @param {string|number} leadId
   * @returns {Promise<Array>}
   */
  getFollowups: async (leadId) => {
    const res = await api.get(`/leads/${leadId}/followups`);
    return res?.followups || (Array.isArray(res) ? res : []);
  },

  /**
   * Schedule a new follow-up
   * @param {string|number} leadId
   * @param {Object} followupData
   * @returns {Promise<Object>}
   */
  scheduleFollowup: async (leadId, followupData) => {
    const res = await api.post(`/leads/${leadId}/followups`, followupData);
    return res?.followup || res;
  },

  /**
   * Update follow-up status (PENDING / COMPLETED / CANCELLED)
   * @param {string|number} leadId
   * @param {string|number} followupId
   * @param {Object} statusData
   * @returns {Promise<Object>}
   */
  updateFollowupStatus: async (leadId, followupId, statusData) => {
    const res = await api.patch(`/leads/${leadId}/followups/${followupId}`, statusData);
    return res?.followup || res;
  },

  /**
   * Fetch active projects list for dropdown selects
   * @returns {Promise<Array>}
   */
  getProjects: async () => {
    const res = await api.get('/projects');
    return res?.projects || (Array.isArray(res) ? res : []);
  },

  /**
   * Fetch active sales reps / users for lead assignment
   * @returns {Promise<Array>}
   */
  getUsers: async () => {
    const res = await api.get('/users');
    return Array.isArray(res) ? res : (res?.users || []);
  },
};

export default leadService;
