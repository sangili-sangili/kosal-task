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

  /** GET /users/roles/all — available roles */
  getRoles: async () => {
    const res = await api.get('/users/roles/all');
    return res.data ?? res;
  },
};
