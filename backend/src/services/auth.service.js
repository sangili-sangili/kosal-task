const userRepository = require('../repositories/user.repository');
const { comparePassword, hashPassword } = require('../utils/password');
const { generateAccessToken } = require('../utils/jwt');
const { UnauthorizedError, NotFoundError, ConflictError } = require('../utils/errors');
const logger = require('../config/logger');

class AuthService {
  /**
   * Authenticate user credentials and generate JWT token
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ user: Object, token: string }>}
   */
  async login(email, password) {
    const user = await userRepository.findByEmail(email, { includePassword: true });
    if (!user) {
      logger.warn(`Failed login attempt for non-existent email: ${email}`);
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      logger.warn(`Login attempt for inactive user ID: ${user.id} (${email})`);
      throw new UnauthorizedError('Your account has been deactivated. Please contact an administrator.', 'ACCOUNT_DEACTIVATED');
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      logger.warn(`Failed login attempt (wrong password) for user ID: ${user.id} (${email})`);
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = generateAccessToken(tokenPayload);

    logger.info(`User logged in successfully: ID ${user.id} (${user.email}) - Role: ${user.role}`);

    return {
      user: user.toJSON(),
      token,
    };
  }

  /**
   * Get current authenticated user profile
   * @param {number|string} userId
   * @returns {Promise<Object>}
   */
  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found', 'USER_NOT_FOUND');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Your account has been deactivated.', 'ACCOUNT_DEACTIVATED');
    }

    return user.toJSON();
  }

  /**
   * Register or create a new user (with duplicate check & password hashing)
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  async registerUser(userData) {
    const existing = await userRepository.findByEmail(userData.email);
    if (existing) {
      throw new ConflictError('A user with this email address already exists', 'EMAIL_ALREADY_EXISTS');
    }

    const hashedPassword = await hashPassword(userData.password);

    const newUser = await userRepository.create({
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password_hash: hashedPassword,
      role: userData.role || 'SALES',
      is_active: true,
    });

    logger.info(`New user registered: ID ${newUser.id} (${newUser.email}) - Role: ${newUser.role}`);
    return newUser.toJSON();
  }
}

module.exports = new AuthService();
