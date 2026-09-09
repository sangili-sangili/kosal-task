const { z } = require('zod');

const createCustomerWithAccountSchema = {
  body: z.object({
    customer: z.object({
      firstName: z.string().trim().min(2, 'First name is required'),
      lastName: z.string().trim().min(2, 'Last name is required'),
      email: z.string().trim().email('Valid email is required'),
      phone: z.string().trim().min(5, 'Phone number is required'),
      company: z.string().trim().optional(),
      status: z.enum(['ACTIVE', 'LEAD', 'CHURNED']).optional(),
    }),
    account: z.object({
      accountType: z.enum(['SAVINGS', 'CHECKING', 'CREDIT']),
      initialDeposit: z.number().min(0, 'Initial deposit cannot be negative').optional(),
      currency: z.string().length(3).optional(),
    }),
  }),
};

const getCustomerListSchema = {
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
    status: z.enum(['ACTIVE', 'LEAD', 'CHURNED']).optional(),
  }),
};

module.exports = {
  createCustomerWithAccountSchema,
  getCustomerListSchema,
};
