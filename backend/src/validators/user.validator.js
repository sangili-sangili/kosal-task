const { z } = require('zod');

const createUserSchema = {
  body: z.object({
    firstName: z.string().trim().min(2, 'First name is required').max(50),
    lastName: z.string().trim().min(2, 'Last name is required').max(50),
    email: z.string().trim().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().trim().max(20).optional(),
    roleId: z.number().int().positive().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  }),
};

const updateUserSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'User ID must be a numeric integer'),
  }),
  body: z.object({
    firstName: z.string().trim().min(2).max(50).optional(),
    lastName: z.string().trim().min(2).max(50).optional(),
    email: z.string().trim().email().optional(),
    password: z.string().min(8).optional(),
    phone: z.string().trim().max(20).optional(),
    roleId: z.number().int().positive().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  }),
};

const getUserListSchema = {
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    sortBy: z.enum(['id', 'firstName', 'lastName', 'email', 'status', 'createdAt']).optional(),
    sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional(),
  }),
};

const userIdParamSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'User ID must be an integer'),
  }),
};

module.exports = {
  createUserSchema,
  updateUserSchema,
  getUserListSchema,
  userIdParamSchema,
};
