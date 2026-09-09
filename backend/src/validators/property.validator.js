const { z } = require('zod');
const { UNIT_STATUS_VALUES } = require('../constants/unitStatus');

// ==========================================
// PROJECT SCHEMAS
// ==========================================

const createProjectSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Project name is required' })
      .trim()
      .min(2, 'Project name must be at least 2 characters')
      .max(150, 'Project name cannot exceed 150 characters'),
    location: z
      .string({ required_error: 'Project location is required' })
      .trim()
      .min(2, 'Location is required')
      .max(255),
    description: z
      .string()
      .trim()
      .optional()
      .nullable(),
    status: z
      .string()
      .trim()
      .default('ACTIVE')
      .optional(),
  }),
};

const updateProjectSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(150).optional(),
    location: z.string().trim().min(2).max(255).optional(),
    description: z.string().trim().optional().nullable(),
    status: z.string().trim().optional(),
  }),
};

// ==========================================
// BUILDING SCHEMAS
// ==========================================

const createBuildingSchema = {
  body: z.object({
    project_id: z
      .number({ required_error: 'Project ID is required' })
      .int()
      .positive(),
    name: z
      .string({ required_error: 'Building/Tower name is required' })
      .trim()
      .min(1, 'Building name cannot be empty')
      .max(100),
    description: z
      .string()
      .trim()
      .optional()
      .nullable(),
  }),
};

const updateBuildingSchema = {
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().optional().nullable(),
  }),
};

// ==========================================
// UNIT SCHEMAS
// ==========================================

const createUnitSchema = {
  body: z.object({
    building_id: z
      .number({ required_error: 'Building ID is required' })
      .int()
      .positive(),
    unit_number: z
      .string({ required_error: 'Unit number is required (e.g. 101, A-302)' })
      .trim()
      .min(1, 'Unit number is required')
      .max(50),
    unit_type: z
      .string({ required_error: 'Unit type is required (e.g. 1BHK, 2BHK, 3BHK)' })
      .trim()
      .min(1, 'Unit type is required')
      .max(50),
    floor: z
      .number({ required_error: 'Floor number is required' })
      .int(),
    area: z
      .number({ required_error: 'Area in sq.ft is required' })
      .positive('Area must be greater than 0'),
    price: z
      .number({ required_error: 'Price is required' })
      .nonnegative('Price cannot be negative'),
    status: z
      .enum(UNIT_STATUS_VALUES, {
        errorMap: () => ({ message: `Status must be one of: ${UNIT_STATUS_VALUES.join(', ')}` }),
      })
      .default('AVAILABLE')
      .optional(),
  }),
};

const updateUnitSchema = {
  body: z.object({
    unit_number: z.string().trim().min(1).max(50).optional(),
    unit_type: z.string().trim().min(1).max(50).optional(),
    floor: z.number().int().optional(),
    area: z.number().positive().optional(),
    price: z.number().nonnegative().optional(),
    status: z.enum(UNIT_STATUS_VALUES).optional(),
  }),
};

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  createBuildingSchema,
  updateBuildingSchema,
  createUnitSchema,
  updateUnitSchema,
};
