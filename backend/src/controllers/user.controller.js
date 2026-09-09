const userRepository = require('../repositories/user.repository');
const { sendSuccess } = require('../utils/response');

class UserController {
  /**
   * List all active CRM users / sales reps
   */
  async list(req, res, next) {
    try {
      const users = await userRepository.findAll({
        attributes: ['id', 'name', 'email', 'role', 'is_active', 'createdAt'],
        where: { is_active: true },
        order: [['name', 'ASC']],
      });

      return sendSuccess(res, 'Users retrieved successfully', users);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new UserController();
