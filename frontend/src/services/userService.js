import api from './api';

export const userService = {
  /** GET /users — paginated list with optional filters */
  getUsers: async (params = {}) => {
    const res = await api.get('/users', { params });
    return res.data ?? res;
  },

  /** GET /users/:id */
  getUserById: async (id) => {
    const res = await api.get(`/users/${id}`);
    return res.data ?? res;
  },

  /** POST /users — create a new user (password defaults to Welcome@123) */
  createUser: async (data) => {
    const res = await api.post('/users', data);
    return res.data ?? res;
  },

  /** PUT /users/:id — update user details */
  updateUser: async (id, data) => {
    const res = await api.put(`/users/${id}`, data);
    return res.data ?? res;
  },

  /** PATCH /users/:id/toggle-status — flip active/inactive */
  toggleUserStatus: async (id) => {
    const res = await api.patch(`/users/${id}/toggle-status`);
    return res.data ?? res;
  },

  /** PATCH /users/:id/reset-password */
  resetPassword: async (id, newPassword) => {
    const res = await api.patch(`/users/${id}/reset-password`, {
      new_password: newPassword || 'Welcome@123',
    });
    return res.data ?? res;
  },

  /** DELETE /users/:id — soft delete */
  deleteUser: async (id) => {
    const res = await api.delete(`/users/${id}`);
    return res.data ?? res;
  },

  /** GET /users/roles/all — available roles with their permissions */
  getRoles: async () => {
    const res = await api.get('/users/roles/all');
    return res.data ?? res;
  },

  /** PUT /users/roles/:code/permissions — update permissions for a role */
  updateRolePermissions: async (code, permissions) => {
    const res = await api.put(`/users/roles/${code}/permissions`, { permissions });
    return res.data ?? res;
  },

  /** POST /users/roles — create a custom role */
  createRole: async (roleData) => {
    const res = await api.post('/users/roles', roleData);
    return res.data ?? res;
  },

  /** DELETE /users/roles/:code — delete custom role */
  deleteRole: async (code) => {
    const res = await api.delete(`/users/roles/${code}`);
    return res.data ?? res;
  },
};
