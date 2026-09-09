const express = require('express');
const bookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const { createBookingSchema } = require('../validators/booking.validator');

const router = express.Router();

router.use(authMiddleware);

/**
 * @route   POST /api/v1/bookings
 * @desc    Reserve/Book an available unit (Atomic double-booking prevention)
 * @access  Private (ADMIN, SALES)
 */
router.post('/', validationMiddleware(createBookingSchema), (req, res, next) => {
  return bookingController.create(req, res, next);
});

/**
 * @route   GET /api/v1/bookings
 * @desc    List bookings (scoped to sales agent if not admin)
 * @access  Private (ADMIN, SALES)
 */
router.get('/', (req, res, next) => {
  return bookingController.list(req, res, next);
});

/**
 * @route   GET /api/v1/bookings/:id
 * @desc    Get booking details
 * @access  Private (ADMIN, SALES - scoped)
 */
router.get('/:id', (req, res, next) => {
  return bookingController.getById(req, res, next);
});

/**
 * @route   PATCH /api/v1/bookings/:id/cancel
 * @desc    Cancel booking and release unit back to AVAILABLE
 * @access  Private (ADMIN, Booking Owner)
 */
router.patch('/:id/cancel', (req, res, next) => {
  return bookingController.cancel(req, res, next);
});

module.exports = router;
