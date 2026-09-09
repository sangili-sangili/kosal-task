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
    cover_image: z.string().optional().nullable(),
    coverImage: z.string().optional().nullable(),
    country: z.string().trim().max(100).optional().nullable(),
    state: z.string().trim().max(100).optional().nullable(),
    city: z.string().trim().max(100).optional().nullable(),
    starting_price: z.string().trim().max(100).optional().nullable(),
    startingPrice: z.string().trim().max(100).optional().nullable(),
    price_range: z.string().trim().max(100).optional().nullable(),
    priceRange: z.string().trim().max(100).optional().nullable(),
    possession_date: z.string().trim().max(100).optional().nullable(),
    possessionDate: z.string().trim().max(100).optional().nullable(),
  }),
};

const updateProjectSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(150).optional(),
    location: z.string().trim().min(2).max(255).optional(),
    description: z.string().trim().optional().nullable(),
    status: z.string().trim().optional(),
    cover_image: z.string().optional().nullable(),
    coverImage: z.string().optional().nullable(),
    country: z.string().trim().max(100).optional().nullable(),
    state: z.string().trim().max(100).optional().nullable(),
    city: z.string().trim().max(100).optional().nullable(),
    starting_price: z.string().trim().max(100).optional().nullable(),
    startingPrice: z.string().trim().max(100).optional().nullable(),
    price_range: z.string().trim().max(100).optional().nullable(),
    priceRange: z.string().trim().max(100).optional().nullable(),
    possession_date: z.string().trim().max(100).optional().nullable(),
    possessionDate: z.string().trim().max(100).optional().nullable(),
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
    building_id: z.number().int().positive().optional(),
    buildingId: z.number().int().positive().optional(),
    unit_number: z.string().trim().min(1).max(50).optional(),
    unitNumber: z.string().trim().min(1).max(50).optional(),
    unit_type: z.string().trim().min(1).max(50).optional(),
    unitType: z.string().trim().min(1).max(50).optional(),
    floor: z.coerce.number().int({ message: 'Floor must be an integer' }),
    area: z.coerce.number().positive('Area must be greater than 0'),
    price: z.coerce.number().nonnegative('Price cannot be negative'),
    facing: z.string().trim().max(50).optional().nullable(),
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
    unitNumber: z.string().trim().min(1).max(50).optional(),
    unit_type: z.string().trim().min(1).max(50).optional(),
    unitType: z.string().trim().min(1).max(50).optional(),
    floor: z.coerce.number().int().optional(),
    area: z.coerce.number().positive().optional(),
    price: z.coerce.number().nonnegative().optional(),
    facing: z.string().trim().max(50).optional().nullable(),
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
