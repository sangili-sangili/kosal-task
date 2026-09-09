const { User } = require('../models');
const BaseRepository = require('./base.repository');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Find a user by email address
   * @param {string} email
   * @param {Object} options
   * @param {boolean} options.includePassword - When true, unmasks password_hash
   * @returns {Promise<User|null>}
   */
  async findByEmail(email, { includePassword = false, ...options } = {}) {
    const queryModel = includePassword ? User.scope('withPassword') : User;
    return queryModel.findOne({
      where: { email: email.toLowerCase().trim() },
      ...options,
    });
  }

  /**
   * Find a user by primary key ID
   * @param {number|string} id
   * @param {Object} options
   * @param {boolean} options.includePassword - When true, unmasks password_hash
   * @returns {Promise<User|null>}
   */
  async findById(id, { includePassword = false, ...options } = {}) {
    const queryModel = includePassword ? User.scope('withPassword') : User;
    return queryModel.findByPk(id, options);
  }
}

module.exports = new UserRepository();
