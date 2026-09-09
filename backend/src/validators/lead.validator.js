const { z } = require('zod');
const { LEAD_STAGE_VALUES, LEAD_STAGES } = require('../constants/leadStages');

/**
 * Validation schema for creating a new Lead
 */
const createLeadSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Lead prospect name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    phone: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .min(5, 'Phone number must have at least 5 digits')
      .max(25, 'Phone number cannot exceed 25 characters'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address')
      .nullable()
      .optional()
      .or(z.literal('')),
    source: z
      .string()
      .trim()
      .max(50, 'Source cannot exceed 50 characters')
      .default('Walk-in')
      .optional(),
    stage: z
      .enum(LEAD_STAGE_VALUES, {
        errorMap: () => ({ message: `Stage must be one of: ${LEAD_STAGE_VALUES.join(', ')}` }),
      })
      .default(LEAD_STAGES.NEW)
      .optional(),
    assigned_to: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),
    follow_up_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Follow-up date must be in YYYY-MM-DD format')
      .nullable()
      .optional()
      .or(z.literal('')),
  }),
};

/**
 * Validation schema for updating a Lead
 */
const updateLeadSchema = {
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .optional(),
    phone: z
      .string()
      .trim()
      .min(5, 'Phone number must have at least 5 digits')
      .max(25, 'Phone number cannot exceed 25 characters')
      .optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address')
      .nullable()
      .optional()
      .or(z.literal('')),
    source: z
      .string()
      .trim()
      .max(50, 'Source cannot exceed 50 characters')
      .optional(),
    stage: z
      .enum(LEAD_STAGE_VALUES, {
        errorMap: () => ({ message: `Stage must be one of: ${LEAD_STAGE_VALUES.join(', ')}` }),
      })
      .optional(),
    assigned_to: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),
    follow_up_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Follow-up date must be in YYYY-MM-DD format')
      .nullable()
      .optional()
      .or(z.literal('')),
  }),
};

/**
 * Validation schema for updating just the Lead Stage
 */
const updateStageSchema = {
  body: z.object({
    stage: z.enum(LEAD_STAGE_VALUES, {
      errorMap: () => ({ message: `Stage must be one of: ${LEAD_STAGE_VALUES.join(', ')}` }),
    }),
  }),
};

module.exports = {
  createLeadSchema,
  updateLeadSchema,
  updateStageSchema,
};
