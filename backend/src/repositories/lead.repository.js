const { Lead, User } = require('../models');
const BaseRepository = require('./base.repository');

class LeadRepository extends BaseRepository {
  constructor() {
    super(Lead);
  }

  /**
   * Find a lead by ID with user associations
   * @param {number|string} id
   * @param {Object} options
   * @returns {Promise<Lead|null>}
   */
  async findById(id, options = {}) {
    return this.model.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedSalesEmployee',
          attributes: ['id', 'name', 'email', 'role'],
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email'],
        },
      ],
      ...options,
    });
  }

  /**
   * Find and count leads matching filter criteria with pagination and relationships
   * @param {Object} queryOptions
   * @returns {Promise<{ rows: Array<Lead>, count: number }>}
   */
  async findAndCountAllFiltered({ where = {}, limit = 20, offset = 0, order = [['created_at', 'DESC']] } = {}) {
    return this.model.findAndCountAll({
      where,
      limit,
      offset,
      order,
      distinct: true,
      include: [
        {
          model: User,
          as: 'assignedSalesEmployee',
          attributes: ['id', 'name', 'email', 'role'],
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
  }
}

module.exports = new LeadRepository();
