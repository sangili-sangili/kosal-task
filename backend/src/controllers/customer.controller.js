const customerService = require('../services/customer.service');
const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants/httpStatusCodes');

class CustomerController {
  async getCustomers(req, res, next) {
    try {
      const { page, limit, search, status } = req.query;
      const result = await customerService.getCustomers({ page, limit, search, status });
      return ApiResponse.success(res, result.items, 'Customers retrieved successfully', HTTP_STATUS.OK, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getCustomerById(req, res, next) {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      return ApiResponse.success(res, customer, 'Customer retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Endpoint demonstrating full ACID Database Transaction
   */
  async createCustomerWithAccount(req, res, next) {
    try {
      const { customer, account } = req.body;
      const result = await customerService.createCustomerWithAccount({
        customerData: customer,
        accountData: account,
        operatorUserId: req.user ? req.user.id : null,
        ipAddress: req.ip,
      });

      return ApiResponse.created(res, result, 'Customer and account created successfully within atomic transaction');
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new CustomerController();
