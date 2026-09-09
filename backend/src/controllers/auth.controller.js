const authService = require('../services/auth.service');
const ApiResponse = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants/httpStatusCodes');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const context = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      };

      const result = await authService.login(email, password, context);
      return ApiResponse.success(res, result, 'Login successful', HTTP_STATUS.OK);
    } catch (error) {
      return next(error);
    }
  }

  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return ApiResponse.created(res, result, 'User registered successfully');
    } catch (error) {
      return next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const context = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      };

      const result = await authService.refreshToken(refreshToken, context);
      return ApiResponse.success(res, result, 'Token refreshed successfully');
    } catch (error) {
      return next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      return next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const userService = require('../services/user.service');
      const user = await userService.getUserById(req.user.id);
      return ApiResponse.success(res, user, 'User profile fetched successfully');
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AuthController();
