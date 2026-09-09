import axios from 'axios';
import { config } from '../config/env';

const api = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token from localStorage
api.interceptors.request.use(
  (reqConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    return reqConfig;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract data & handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    // 401 Unauthorized handling (token expired, invalid, or missing)
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login')
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('crm_current_user');

      // Only redirect if not already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    const customError = {
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred',
      code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
      details: error.response?.data?.error?.details || null,
    };

    return Promise.reject(customError);
  }
);

export default api;
