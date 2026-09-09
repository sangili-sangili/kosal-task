import api from './api';

export const bookingService = {
  /**
   * Fetch paginated bookings with filters
   * @param {Object} [params] - { page, limit, search, status, payment_status, project_id, agent_id, sort, order }
   * @returns {Promise<{ bookings: Array, pagination: Object }>}
   */
  getBookings: async (params = {}) => {
    const res = await api.get('/bookings', { params });
    if (res && res.data && Array.isArray(res.data)) {
      return {
        bookings: res.data,
        pagination: res.pagination || { total: res.data.length, page: 1, limit: 20, totalPages: 1 },
      };
    }
    if (Array.isArray(res)) {
      return {
        bookings: res,
        pagination: { total: res.length, page: 1, limit: 20, totalPages: 1 },
      };
    }
    return {
      bookings: res?.bookings || [],
      pagination: res?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 },
    };
  },

  /**
   * Get single booking details by ID
   * @param {string|number} id
   * @returns {Promise<Object>}
   */
  getBookingById: async (id) => {
    const res = await api.get(`/bookings/${id}`);
    return res?.booking || res;
  },

  /**
   * Create a new unit booking with double-booking prevention
   * @param {Object} data - { lead_id, unit_id, amount, booking_date }
   * @returns {Promise<Object>}
   */
  createBooking: async (data) => {
    const res = await api.post('/bookings', data);
    return res?.booking || res;
  },

  /**
   * Update booking lifecycle status and payment status
   * @param {string|number} id
   * @param {Object} data - { status, payment_status, notes }
   * @returns {Promise<Object>}
   */
  updateBookingStatus: async (id, data) => {
    const res = await api.patch(`/bookings/${id}/status`, data);
    return res?.booking || res;
  },

  /**
   * Cancel an existing booking and release unit back to AVAILABLE
   * @param {string|number} id
   * @param {string} [reason]
   * @returns {Promise<Object>}
   */
  cancelBooking: async (id, reason = '') => {
    const res = await api.patch(`/bookings/${id}/cancel`, { reason, cancellation_reason: reason });
    return res?.booking || res;
  },
};

export default bookingService;
