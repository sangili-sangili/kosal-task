const { z } = require('zod');
const { ROLES } = require('../constants/roles');

/**
 * Validation schema for user authentication (Login)
 */
const loginSchema = {
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password cannot be empty'),
  }),
};

/**
 * Validation schema for user registration / admin creation
 */
const createUserSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters'),
    role: z
      .enum([ROLES.ADMIN, ROLES.SALES], {
        errorMap: () => ({ message: `Role must be either ${ROLES.ADMIN} or ${ROLES.SALES}` }),
      })
      .default(ROLES.SALES),
  }),
};

module.exports = {
  loginSchema,
  createUserSchema,
};
