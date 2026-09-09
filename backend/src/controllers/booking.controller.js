const bookingService = require('../services/booking.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');

class BookingController {
  /**
   * Create a unit booking
   * POST /api/v1/bookings
   */
  async create(req, res, next) {
    try {
      const booking = await bookingService.createBooking(req.body, req.user);
      return sendCreated(res, 'Booking created and confirmed successfully', { booking });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * List all bookings with pagination
   * GET /api/v1/bookings
   */
  async list(req, res, next) {
    try {
      const { bookings, pagination } = await bookingService.getBookings(req.query, req.user);
      return sendPaginated(res, 'Bookings retrieved successfully', bookings, pagination);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Get booking details by ID
   * GET /api/v1/bookings/:id
   */
  async getById(req, res, next) {
    try {
      const booking = await bookingService.getBookingById(req.params.id, req.user);
      return sendSuccess(res, 'Booking details retrieved successfully', { booking });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Cancel an existing booking
   * PATCH /api/v1/bookings/:id/cancel
   */
  async cancel(req, res, next) {
    try {
      const reason = req.body?.reason || req.body?.cancellation_reason;
      const booking = await bookingService.cancelBooking(req.params.id, req.user, reason);
      return sendSuccess(res, 'Booking cancelled successfully and unit released to inventory', { booking });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Update booking status and payment status
   * PATCH /api/v1/bookings/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const booking = await bookingService.updateBookingStatus(req.params.id, req.body, req.user);
      return sendSuccess(res, 'Booking status updated successfully', { booking });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new BookingController();
