import api from './api';

export const customerService = {
  getCustomers: async (params = {}) => {
    return api.get('/customers', { params });
  },

  getCustomerById: async (id) => {
    return api.get(`/customers/${id}`);
  },

  createTransactionDemo: async (payload) => {
    return api.post('/customers/transaction-demo', payload);
  },
};
