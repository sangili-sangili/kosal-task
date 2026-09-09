const { Op } = require('sequelize');
const BaseRepository = require('./base.repository');
const { User, Role, Permission } = require('../models');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, options = {}) {
    return this.model.findOne({
      where: { email: email.toLowerCase().trim() },
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
          include: [
            {
              model: Permission,
              as: 'permissions',
              through: { attributes: [] },
            },
          ],
        },
      ],
      ...options,
    });
  }

  async findByUuid(uuid, options = {}) {
    return this.model.findOne({
      where: { uuid },
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
        },
      ],
      ...options,
    });
  }

  async findByIdWithRoles(id, options = {}) {
    return this.model.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
          include: [
            {
              model: Permission,
              as: 'permissions',
              through: { attributes: [] },
            },
          ],
        },
      ],
      ...options,
    });
  }

  async searchUsers({ page = 1, limit = 20, search = '', status = '', sortBy = 'createdAt', sortOrder = 'DESC' }) {
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
      ];
    }

    // Allowed sort columns to prevent SQL injection in ORDER BY
    const allowedSortColumns = ['id', 'firstName', 'lastName', 'email', 'status', 'createdAt'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    return this.paginate({
      page,
      limit,
      where,
      order: [[safeSortBy, safeSortOrder]],
      include: [
        {
          model: Role,
          as: 'roles',
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
      ],
      attributes: ['id', 'uuid', 'firstName', 'lastName', 'email', 'phone', 'status', 'lastLoginAt', 'createdAt'],
    });
  }
}

module.exports = new UserRepository();
