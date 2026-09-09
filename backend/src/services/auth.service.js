const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');
const { RefreshToken, sequelize } = require('../models');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, hashRefreshToken } = require('../utils/jwt');
const { UnauthorizedError, ConflictError, BadRequestError } = require('../errors');
const appEvents = require('../events/eventEmitter');
const env = require('../config/env');
const { ROLES } = require('../constants/roles');

class AuthService {
  async login(email, password, { ipAddress = null, userAgent = null } = {}) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError(`Account is currently ${user.status.toLowerCase()}`, 'ACCOUNT_DISABLED');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const roleNames = user.roles ? user.roles.map((r) => r.name) : [];
    const permissions = [];
    if (user.roles) {
      user.roles.forEach((r) => {
        if (r.permissions) {
          r.permissions.forEach((p) => {
            if (!permissions.includes(p.name)) permissions.push(p.name);
          });
        }
      });
    }

    const tokenPayload = {
      sub: user.id,
      uuid: user.uuid,
      email: user.email,
      roles: roleNames,
      permissions,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.JWT.REFRESH_EXPIRATION_DAYS);

    // Save refresh token
    await RefreshToken.create({
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent,
    });

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    appEvents.emit('user:login', { user, ipAddress });

    return {
      user: {
        id: user.id,
        uuid: user.uuid,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: roleNames,
        permissions,
      },
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresIn: env.JWT.ACCESS_EXPIRATION,
      },
    };
  }

  async register(userData, { defaultRole = ROLES.CUSTOMER } = {}) {
    const existing = await userRepository.findByEmail(userData.email);
    if (existing) {
      throw new ConflictError('A user with this email address already exists', 'EMAIL_ALREADY_EXISTS');
    }

    const hashedPassword = await hashPassword(userData.password);

    // Transaction for atomic user & role creation
    const transaction = await sequelize.transaction();
    try {
      const user = await userRepository.create(
        {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email.toLowerCase().trim(),
          password: hashedPassword,
          phone: userData.phone || null,
          status: 'ACTIVE',
        },
        { transaction }
      );

      // Assign default role
      const role = await roleRepository.findByName(defaultRole, { transaction });
      if (role) {
        await user.setRoles([role], { transaction });
      }

      await transaction.commit();

      appEvents.emit('user:registered', user);

      return {
        id: user.id,
        uuid: user.uuid,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async refreshToken(rawRefreshToken, { ipAddress = null, userAgent = null } = {}) {
    if (!rawRefreshToken) {
      throw new BadRequestError('Refresh token is required');
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const storedToken = await RefreshToken.findOne({ where: { tokenHash } });

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token', 'TOKEN_INVALID');
    }

    // Reuse Detection: If someone presents an already revoked token, this indicates token theft!
    if (storedToken.isRevoked) {
      // Invalidate all tokens for this user immediately!
      await RefreshToken.update(
        { isRevoked: true, revokedAt: new Date() },
        { where: { userId: storedToken.userId } }
      );

      appEvents.emit('security:token_reuse_detected', {
        userId: storedToken.userId,
        ipAddress,
      });

      throw new UnauthorizedError('Revoked token reuse detected. All sessions terminated.', 'SECURITY_ALERT');
    }

    if (storedToken.isExpired) {
      throw new UnauthorizedError('Refresh token has expired', 'TOKEN_EXPIRED');
    }

    // Revoke current token (Token Rotation)
    const newRawRefreshToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRawRefreshToken);

    await storedToken.update({
      isRevoked: true,
      revokedAt: new Date(),
      replacedByTokenHash: newTokenHash,
    });

    // Create new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.JWT.REFRESH_EXPIRATION_DAYS);

    await RefreshToken.create({
      userId: storedToken.userId,
      tokenHash: newTokenHash,
      expiresAt,
      ipAddress,
      userAgent,
    });

    // Load user claims
    const user = await userRepository.findByIdWithRoles(storedToken.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User account is inactive', 'ACCOUNT_DISABLED');
    }

    const roleNames = user.roles ? user.roles.map((r) => r.name) : [];
    const permissions = [];
    if (user.roles) {
      user.roles.forEach((r) => {
        if (r.permissions) {
          r.permissions.forEach((p) => {
            if (!permissions.includes(p.name)) permissions.push(p.name);
          });
        }
      });
    }

    const newAccessToken = generateAccessToken({
      sub: user.id,
      uuid: user.uuid,
      email: user.email,
      roles: roleNames,
      permissions,
    });

    return {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRawRefreshToken,
        expiresIn: env.JWT.ACCESS_EXPIRATION,
      },
    };
  }

  async logout(rawRefreshToken) {
    if (!rawRefreshToken) return true;
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const storedToken = await RefreshToken.findOne({ where: { tokenHash } });
    if (storedToken) {
      await storedToken.update({ isRevoked: true, revokedAt: new Date() });
    }
    return true;
  }
}

module.exports = new AuthService();
