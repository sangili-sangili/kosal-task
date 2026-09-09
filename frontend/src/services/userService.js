import api from './api';

export const userService = {
  getUsers: async (params = {}) => {
    return api.get('/users', { params });
  },

  getUserById: async (id) => {
    return api.get(`/users/${id}`);
  },

  createUser: async (data) => {
    return api.post('/users', data);
  },

  updateUser: async (id, data) => {
    return api.put(`/users/${id}`, data);
  },

  deleteUser: async (id) => {
    return api.delete(`/users/${id}`);
  },

  getRoles: async () => {
    return api.get('/users/roles/all');
  },
};
