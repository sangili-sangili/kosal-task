const { z } = require('zod');

/**
 * Validation schema for creating a Unit Booking
 */
const createBookingSchema = {
  body: z.object({
    lead_id: z
      .number({ required_error: 'Lead prospect ID is required' })
      .int()
      .positive('Lead ID must be a positive integer'),
    unit_id: z
      .number({ required_error: 'Inventory Unit ID is required' })
      .int()
      .positive('Unit ID must be a positive integer'),
    amount: z
      .number()
      .positive('Booking amount must be greater than 0')
      .optional(),
    booking_date: z
      .string()
      .optional(),
  }),
};

module.exports = {
  createBookingSchema,
};
