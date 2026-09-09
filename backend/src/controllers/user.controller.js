const userService = require('../services/user.service');
const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants/httpStatusCodes');

class UserController {
  async getUsers(req, res, next) {
    try {
      const { page, limit, search, status, sortBy, sortOrder } = req.query;
      const result = await userService.getUsers({
        page,
        limit,
        search,
        status,
        sortBy,
        sortOrder,
      });

      return ApiResponse.success(res, result.items, 'Users retrieved successfully', HTTP_STATUS.OK, result.pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      return ApiResponse.success(res, user, 'User retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      return ApiResponse.created(res, user, 'User created successfully');
    } catch (error) {
      return next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      return ApiResponse.success(res, user, 'User updated successfully');
    } catch (error) {
      return next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(req.params.id);
      return ApiResponse.success(res, result, 'User deleted successfully');
    } catch (error) {
      return next(error);
    }
  }

  async getRoles(req, res, next) {
    try {
      const roles = await userService.getRoles();
      return ApiResponse.success(res, roles, 'Roles retrieved successfully');
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new UserController();
