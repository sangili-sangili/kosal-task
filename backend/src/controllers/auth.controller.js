const authService = require('../services/auth.service');
const { sendSuccess, sendCreated } = require('../utils/response');

class AuthController {
  /**
   * User login endpoint
   * POST /api/v1/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return sendSuccess(res, 'Login successful', result);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Get current authenticated user profile
   * GET /api/v1/auth/me
   */
  async getMe(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      return sendSuccess(res, 'Profile retrieved successfully', { user });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * User registration / admin user creation endpoint
   * POST /api/v1/auth/register
   */
  async register(req, res, next) {
    try {
      const user = await authService.registerUser(req.body);
      return sendCreated(res, 'User registered successfully', { user });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AuthController();
