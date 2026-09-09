const customerRepository = require('../repositories/customer.repository');
const { Customer, Account, AuditLog, sequelize } = require('../models');
const { dispatchJob } = require('../jobs/queues/notificationQueue');
const { NotFoundError, BadRequestError } = require('../errors');
const logger = require('../config/logger');

class CustomerService {
  async getCustomers(params) {
    return customerRepository.searchCustomers(params);
  }

  async getCustomerById(id) {
    const customer = await customerRepository.findWithAccounts(id);
    if (!customer) {
      throw new NotFoundError(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  /**
   * Enterprise Transaction Example (Topic 11 & 24)
   * 1. Create Customer
   * 2. Create Customer Financial Account
   * 3. Create Audit Trail Entry
   * 4. Dispatch Async Notification
   * All DB operations commit atomically or rollback completely.
   */
  async createCustomerWithAccount({ customerData, accountData, operatorUserId = null, ipAddress = null }) {
    if (!customerData || !accountData) {
      throw new BadRequestError('Customer and account details are required.');
    }

    // Step 1: Start Managed Sequelize Transaction
    const transaction = await sequelize.transaction();

    try {
      logger.info('Starting atomic transaction for Customer & Account creation...');

      // Step 2: Create Customer Entity
      const customer = await Customer.create(
        {
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email.toLowerCase().trim(),
          phone: customerData.phone,
          company: customerData.company || null,
          status: customerData.status || 'ACTIVE',
        },
        { transaction }
      );

      // Step 3: Create Primary Financial Account
      const accountNumber = `ACC-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
      const account = await Account.create(
        {
          customerId: customer.id,
          accountNumber,
          accountType: accountData.accountType || 'CHECKING',
          balance: accountData.initialDeposit ? parseFloat(accountData.initialDeposit) : 0.00,
          currency: accountData.currency || 'USD',
          status: 'ACTIVE',
        },
        { transaction }
      );

      // Step 4: Create Immutable Audit Log
      await AuditLog.create(
        {
          userId: operatorUserId,
          action: 'CUSTOMER_AND_ACCOUNT_CREATED',
          entity: 'Customer',
          entityId: String(customer.id),
          details: {
            accountNumber,
            accountType: account.accountType,
            initialDeposit: account.balance,
          },
          ipAddress,
        },
        { transaction }
      );

      // Step 5: Commit Transaction Atomically
      await transaction.commit();
      logger.info(`Transaction successfully committed for Customer ID: ${customer.id}`);

      // Step 6: Trigger Post-Commit Side Effects (Async Background Job)
      await dispatchJob('sendWelcomeNotification', {
        email: customer.email,
        name: `${customer.firstName} ${customer.lastName}`,
        accountNumber,
      });

      return {
        customer,
        account,
      };
    } catch (error) {
      // Rollback on any failure - zero orphaned records
      await transaction.rollback();
      logger.error('Transaction failed and was rolled back cleanly:', error);
      throw error;
    }
  }
}

module.exports = new CustomerService();
