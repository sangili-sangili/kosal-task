/**
 * Booking Status Constants
 */
const BOOKING_STATUS = Object.freeze({
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
});

const BOOKING_STATUS_VALUES = Object.values(BOOKING_STATUS);

module.exports = {
  BOOKING_STATUS,
  BOOKING_STATUS_VALUES,
};
