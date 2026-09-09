const { Op } = require('sequelize');
const BaseRepository = require('./base.repository');
const { Customer, Account } = require('../models');

class CustomerRepository extends BaseRepository {
  constructor() {
    super(Customer);
  }

  async findWithAccounts(id, options = {}) {
    return this.model.findByPk(id, {
      include: [
        {
          model: Account,
          as: 'accounts',
        },
      ],
      ...options,
    });
  }

  async searchCustomers({ page = 1, limit = 20, search = '', status = '' }) {
    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      const searchTerm = `%${search}%`;
      where[Op.or] = [
        { firstName: { [Op.like]: searchTerm } },
        { lastName: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } },
        { company: { [Op.like]: searchTerm } },
      ];
    }

    return this.paginate({
      page,
      limit,
      where,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Account,
          as: 'accounts',
        },
      ],
    });
  }
}

module.exports = new CustomerRepository();
