const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');
const cacheService = require('./cache.service');
const { hashPassword } = require('../utils/password');
const { NotFoundError, ConflictError, BadRequestError } = require('../errors');
const { ROLES } = require('../constants/roles');

class UserService {
  async getUsers(params) {
    return userRepository.searchUsers(params);
  }

  async getUserById(id) {
    const cacheKey = `cache:users:${id}`;
    return cacheService.wrap(cacheKey, async () => {
      const user = await userRepository.findByIdWithRoles(id);
      if (!user) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
      return {
        id: user.id,
        uuid: user.uuid,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        roles: user.roles ? user.roles.map((r) => ({ id: r.id, name: r.name })) : [],
      };
    }, 1800); // 30 minutes TTL
  }

  async createUser(data) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('User with this email already exists', 'EMAIL_ALREADY_EXISTS');
    }

    const hashedPassword = await hashPassword(data.password);
    const user = await userRepository.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      phone: data.phone || null,
      status: data.status || 'ACTIVE',
    });

    if (data.roleId) {
      const role = await roleRepository.findById(data.roleId);
      if (role) {
        await user.setRoles([role]);
      }
    } else {
      // Default to STAFF or CUSTOMER
      const defaultRole = await roleRepository.findByName(ROLES.STAFF);
      if (defaultRole) {
        await user.setRoles([defaultRole]);
      }
    }

    return this.getUserById(user.id);
  }

  async updateUser(id, updateData) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    if (updateData.email && updateData.email !== user.email) {
      const existing = await userRepository.findByEmail(updateData.email);
      if (existing) {
        throw new ConflictError('Email already in use by another account');
      }
    }

    const fieldsToUpdate = {};
    if (updateData.firstName) fieldsToUpdate.firstName = updateData.firstName;
    if (updateData.lastName) fieldsToUpdate.lastName = updateData.lastName;
    if (updateData.email) fieldsToUpdate.email = updateData.email.toLowerCase().trim();
    if (updateData.phone !== undefined) fieldsToUpdate.phone = updateData.phone;
    if (updateData.status) fieldsToUpdate.status = updateData.status;

    if (updateData.password) {
      fieldsToUpdate.password = await hashPassword(updateData.password);
    }

    await user.update(fieldsToUpdate);

    if (updateData.roleId) {
      const role = await roleRepository.findById(updateData.roleId);
      if (role) {
        await user.setRoles([role]);
      }
    }

    // Invalidate Redis cache
    await cacheService.del(`cache:users:${id}`);

    return this.getUserById(id);
  }

  async deleteUser(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    // Soft delete
    await user.destroy();

    // Invalidate cache
    await cacheService.del(`cache:users:${id}`);

    return { id, deleted: true };
  }

  async getRoles() {
    return roleRepository.findAllWithPermissions();
  }
}

module.exports = new UserService();
