const { z } = require('zod');
const { FOLLOWUP_STATUS } = require('../models/LeadFollowup');

/**
 * Validation schema for creating a Lead Note
 */
const createNoteSchema = {
  body: z.object({
    note: z
      .string({ required_error: 'Note content cannot be empty' })
      .trim()
      .min(1, 'Note content cannot be empty'),
  }),
};

/**
 * Validation schema for scheduling a Lead Follow-up
 */
const createFollowupSchema = {
  body: z.object({
    follow_up_date: z
      .string({ required_error: 'Follow-up date is required' })
      .min(1, 'Follow-up date is required'),
    assigned_to: z
      .number()
      .int()
      .positive()
      .optional(),
    remarks: z
      .string()
      .trim()
      .optional(),
  }),
};

/**
 * Validation schema for updating a Follow-up status
 */
const updateFollowupStatusSchema = {
  body: z.object({
    status: z.enum([FOLLOWUP_STATUS.PENDING, FOLLOWUP_STATUS.COMPLETED, FOLLOWUP_STATUS.CANCELLED], {
      errorMap: () => ({
        message: `Status must be one of: ${Object.values(FOLLOWUP_STATUS).join(', ')}`,
      }),
    }),
    remarks: z
      .string()
      .trim()
      .optional(),
  }),
};

module.exports = {
  createNoteSchema,
  createFollowupSchema,
  updateFollowupStatusSchema,
};
