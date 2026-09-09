const { z } = require('zod');

const loginSchema = {
  body: z.object({
    email: z.string().trim().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
};

const registerSchema = {
  body: z.object({
    firstName: z.string().trim().min(2, 'First name must have at least 2 characters').max(50),
    lastName: z.string().trim().min(2, 'Last name must have at least 2 characters').max(50),
    email: z.string().trim().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    phone: z.string().trim().max(20).optional(),
  }),
};

const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

module.exports = {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
};
