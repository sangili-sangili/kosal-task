import api from './api';

export const propertyService = {
  /**
   * Fetch all property development projects with buildings
   * @returns {Promise<Array>}
   */
  getProjects: async () => {
    const res = await api.get('/projects');
    return res?.projects || (Array.isArray(res) ? res : []);
  },

  /**
   * Get single project details by ID with buildings and units
   * @param {string|number} id
   * @returns {Promise<Object>}
   */
  getProjectById: async (id) => {
    const res = await api.get(`/projects/${id}`);
    return res?.project || res;
  },

  /**
   * Create a new property project
   * @param {Object} data - { name, location, description, status }
   * @returns {Promise<Object>}
   */
  createProject: async (data) => {
    const res = await api.post('/projects', data);
    return res?.project || res;
  },

  /**
   * Update an existing project
   * @param {string|number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  updateProject: async (id, data) => {
    const res = await api.patch(`/projects/${id}`, data);
    return res?.project || res;
  },

  /**
   * Soft-delete a project (Admin only)
   * @param {string|number} id
   * @returns {Promise<Object>}
   */
  deleteProject: async (id) => {
    return api.delete(`/projects/${id}`);
  },

  /**
   * Fetch all buildings/towers for a project
   * @param {string|number} projectId
   * @returns {Promise<Array>}
   */
  getBuildings: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/buildings`);
    return res?.buildings || (Array.isArray(res) ? res : []);
  },

  /**
   * Create a building/tower under a project
   * @param {string|number} projectId
   * @param {Object} data - { name, description }
   * @returns {Promise<Object>}
   */
  createBuilding: async (projectId, data) => {
    const res = await api.post(`/projects/${projectId}/buildings`, {
      ...data,
      project_id: parseInt(projectId, 10),
    });
    return res?.building || res;
  },

  /**
   * Fetch paginated inventory units with optional filters
   * @param {Object} [params] - { page, limit, status, unit_type, min_price, max_price, building_id }
   * @returns {Promise<{ units: Array, pagination: Object }>}
   */
  getUnits: async (params = {}) => {
    const res = await api.get('/units', { params });
    if (res && res.data && Array.isArray(res.data)) {
      return {
        units: res.data,
        pagination: res.pagination || { total: res.data.length, page: 1, limit: 20, totalPages: 1 },
      };
    }
    if (Array.isArray(res)) {
      return {
        units: res,
        pagination: { total: res.length, page: 1, limit: 20, totalPages: 1 },
      };
    }
    return {
      units: res?.units || [],
      pagination: res?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },

  /**
   * Get single inventory unit details by ID
   * @param {string|number} id
   * @returns {Promise<Object>}
   */
  getUnitById: async (id) => {
    const res = await api.get(`/units/${id}`);
    return res?.unit || res;
  },

  /**
   * Create a new inventory unit in a building
   * @param {Object} data - { building_id, unit_number, unit_type, floor, area, price, status }
   * @returns {Promise<Object>}
   */
  createUnit: async (data) => {
    const res = await api.post('/units', data);
    return res?.unit || res;
  },

  /**
   * Update an existing unit
   * @param {string|number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  updateUnit: async (id, data) => {
    const res = await api.patch(`/units/${id}`, data);
    return res?.unit || res;
  },

  /**
   * Delete an inventory unit
   * @param {string|number} id
   * @returns {Promise<Object>}
   */
  deleteUnit: async (id) => {
    return api.delete(`/units/${id}`);
  },
};

export default propertyService;
