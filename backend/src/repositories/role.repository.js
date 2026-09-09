const BaseRepository = require('./base.repository');
const { Role, Permission } = require('../models');

class RoleRepository extends BaseRepository {
  constructor() {
    super(Role);
  }

  async findByName(name, options = {}) {
    return this.model.findOne({
      where: { name },
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
      ...options,
    });
  }

  async findAllWithPermissions(options = {}) {
    return this.model.findAll({
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
        },
      ],
      ...options,
    });
  }
}

module.exports = new RoleRepository();
