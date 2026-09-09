const express = require('express');
const customerController = require('../../controllers/customer.controller');
const authenticate = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  createCustomerWithAccountSchema,
  getCustomerListSchema,
} = require('../../validators/customer.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @route GET /api/v1/customers
 * @desc Get paginated customers list
 * @access Private
 */
router.get('/', validate(getCustomerListSchema), customerController.getCustomers);

/**
 * @route GET /api/v1/customers/:id
 * @desc Get customer with accounts
 * @access Private
 */
router.get('/:id', customerController.getCustomerById);

/**
 * @route POST /api/v1/customers/transaction-demo
 * @desc ACID Database Transaction Demonstration: Creates Customer + Account + AuditLog atomically
 * @access Private
 */
router.post(
  '/transaction-demo',
  validate(createCustomerWithAccountSchema),
  customerController.createCustomerWithAccount
);

module.exports = router;
