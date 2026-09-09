const userRepository = require('../repositories/user.repository');
const { User, Role } = require('../models');
const { sendSuccess } = require('../utils/response');
const { ROLES } = require('../constants/roles');
const { Op } = require('sequelize');
const auditService = require('../services/audit.service');

class UserController {
  /**
   * GET /users — paginated, filtered list
   */
  async list(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        role,
        status,
        sort = 'name',
        order = 'ASC',
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where = {};

      if (search) {
        where[Op.or] = [
          { name:  { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ];
      }

      if (role)   where.role      = role;
      if (status === 'ACTIVE')   where.is_active = true;
      if (status === 'INACTIVE') where.is_active = false;

      const allowedSort  = ['name', 'email', 'role', 'createdAt'];
      const allowedOrder = ['ASC', 'DESC'];
      const sortField    = allowedSort.includes(sort)          ? sort          : 'name';
      const sortOrder    = allowedOrder.includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

      const { count, rows } = await User.findAndCountAll({
        where,
        order:  [[sortField, sortOrder]],
        limit:  Number(limit),
        offset,
        attributes: ['id', 'name', 'email', 'role', 'is_active', 'createdAt', 'updatedAt'],
      });

      return sendSuccess(res, 'Users retrieved', {
        users: rows,
        pagination: {
          total:      count,
          page:       Number(page),
          limit:      Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /users/:id — single user
   */
  async getById(req, res, next) {
    try {
      const user = await User.findByPk(req.params.id, {
        attributes: ['id', 'name', 'email', 'role', 'is_active', 'createdAt', 'updatedAt'],
      });
      if (!user) return res.status(404).json({ message: 'User not found' });
      return sendSuccess(res, 'User retrieved', user);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * POST /users — create new user
   */
  async create(req, res, next) {
    try {
      const { name, email, role = ROLES.SALES, password = 'Welcome@123', is_active = true } = req.body;

      if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
      }

      const existing = await User.findOne({ where: { email: email.toLowerCase().trim() }, paranoid: false });
      if (existing) {
        return res.status(409).json({ message: 'A user with this email already exists' });
      }

      const password_hash = await User.hashPassword(password);

      const user = await User.create({
        name:          name.trim(),
        email:         email.toLowerCase().trim(),
        role,
        is_active,
        password_hash,
      });

      const { password_hash: _ph, ...safeUser } = user.toJSON ? user.toJSON() : user.get();

      auditService.logEvent({
        action: 'CREATE',
        entityType: 'USER',
        entityId: String(user.id),
        entityTitle: `${user.name} (${user.role})`,
        summary: `Created new user account "${user.name}" with role ${user.role}.`,
        actorId: req.user?.id,
        actorName: req.user?.name,
        actorEmail: req.user?.email,
        actorRole: req.user?.role,
        ipAddress: req.ip || '127.0.0.1',
        severity: 'SUCCESS',
        details: { userId: user.id, email: user.email, role: user.role },
      });

      return res.status(201).json({ success: true, message: 'User created successfully', data: safeUser });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUT /users/:id — update user details
   */
  async update(req, res, next) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const { name, email, role, is_active } = req.body;

      if (email && email !== user.email) {
        const conflict = await User.findOne({
          where: { email: email.toLowerCase().trim(), id: { [Op.ne]: user.id } },
        });
        if (conflict) return res.status(409).json({ message: 'Email already in use by another user' });
      }

      await user.update({
        ...(name      !== undefined && { name:      name.trim() }),
        ...(email     !== undefined && { email:     email.toLowerCase().trim() }),
        ...(role      !== undefined && { role }),
        ...(is_active !== undefined && { is_active }),
      });

      auditService.logEvent({
        action: 'UPDATE',
        entityType: 'USER',
        entityId: String(user.id),
        entityTitle: `${user.name} (${user.role})`,
        summary: `Updated profile details for user "${user.name}".`,
        actorId: req.user?.id,
        actorName: req.user?.name,
        actorEmail: req.user?.email,
        actorRole: req.user?.role,
        ipAddress: req.ip || '127.0.0.1',
        severity: 'INFO',
        details: { updatedFields: { name, email, role, is_active } },
      });

      return sendSuccess(res, 'User updated successfully', user);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PATCH /users/:id/toggle-status — flip is_active
   */
  async toggleStatus(req, res, next) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      await user.update({ is_active: !user.is_active });

      auditService.logEvent({
        action: 'UPDATE',
        entityType: 'USER',
        entityId: String(user.id),
        entityTitle: `${user.name} (${user.role})`,
        summary: `User account status changed to ${user.is_active ? 'ACTIVE' : 'INACTIVE'} for "${user.name}".`,
        actorId: req.user?.id,
        actorName: req.user?.name,
        actorEmail: req.user?.email,
        actorRole: req.user?.role,
        ipAddress: req.ip || '127.0.0.1',
        severity: user.is_active ? 'SUCCESS' : 'WARNING',
      });

      return sendSuccess(res, `User ${user.is_active ? 'activated' : 'deactivated'} successfully`, user);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PATCH /users/:id/reset-password — set a new password
   */
  async resetPassword(req, res, next) {
    try {
      const user = await User.scope('withPassword').findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const { new_password = 'Welcome@123' } = req.body;
      const password_hash = await User.hashPassword(new_password);
      await user.update({ password_hash });

      auditService.logEvent({
        action: 'SECURITY',
        entityType: 'USER',
        entityId: String(user.id),
        entityTitle: `${user.name} (${user.role})`,
        summary: `Administrative password reset executed for "${user.name}".`,
        actorId: req.user?.id,
        actorName: req.user?.name,
        actorEmail: req.user?.email,
        actorRole: req.user?.role,
        ipAddress: req.ip || '127.0.0.1',
        severity: 'WARNING',
      });

      return sendSuccess(res, 'Password reset successfully');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * DELETE /users/:id — soft delete
   */
  async remove(req, res, next) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      await user.destroy(); // paranoid soft-delete

      auditService.logEvent({
        action: 'DELETE',
        entityType: 'USER',
        entityId: String(user.id),
        entityTitle: `${user.name} (${user.role})`,
        summary: `User account "${user.name}" soft-deleted from system.`,
        actorId: req.user?.id,
        actorName: req.user?.name,
        actorEmail: req.user?.email,
        actorRole: req.user?.role,
        ipAddress: req.ip || '127.0.0.1',
        severity: 'WARNING',
      });

      return sendSuccess(res, 'User deleted successfully');
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /users/roles/all — list all roles with their live database permissions
   */
  async getRoles(req, res, next) {
    try {
      let roles = await Role.findAll({ order: [['id', 'ASC']] });
      if (!roles || roles.length === 0) {
        const allPerms = Object.values(require('../constants/permissions').PERMISSIONS);
        const adminRole = await Role.create({
          code: 'ADMIN',
          name: 'Administrator',
          description: 'System Administrator with unrestricted access',
          permissions: allPerms,
          is_system: true,
        });
        const salesRole = await Role.create({
          code: 'SALES',
          name: 'Sales Executive',
          description: 'Sales representative handling prospect leads and unit bookings',
          permissions: [
            'dashboard:view', 'customer:read', 'customer:create', 'customer:update',
            'property:read', 'transaction:read', 'transaction:create', 'booking:update'
          ],
          is_system: true,
        });
        roles = [adminRole, salesRole];
      }

      const roleList = roles.map((r) => ({
        id:          r.id,
        code:        r.code,
        name:        r.name,
        description: r.description,
        permissions: r.permissions || [],
        isSystem:    Boolean(r.is_system),
        label:       r.name,
      }));

      return sendSuccess(res, 'Roles retrieved', roleList);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * PUT /users/roles/:code/permissions — update permissions for a role in MySQL
   */
  async updateRolePermissions(req, res, next) {
    try {
      const { code } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({ success: false, message: 'Permissions must be an array of permission IDs' });
      }

      const role = await Role.findOne({ where: { code: code.toUpperCase() } });
      if (!role) {
        return res.status(404).json({ success: false, message: `Role '${code}' not found` });
      }

      role.permissions = permissions;
      await role.save();

      auditService.logEvent({
        action: 'SECURITY',
        entityType: 'ROLE',
        entityId: role.code,
        entityTitle: `${role.name} (${role.code})`,
        summary: `Updated access permissions for role "${role.name}". Active permissions: ${permissions.length}.`,
        actorId: req.user?.id,
        actorName: req.user?.name,
        actorEmail: req.user?.email,
        actorRole: req.user?.role,
        severity: 'INFO',
        details: {
          role: role.code,
          permissionsCount: permissions.length,
          permissions,
        },
      });

      return sendSuccess(res, `Permissions for role '${role.name}' updated successfully`, {
        code: role.code,
        name: role.name,
        permissions: role.permissions,
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * POST /users/roles — create a custom security role in MySQL
   */
  async createRole(req, res, next) {
    try {
      const { code, name, description, permissions } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Role name is required' });
      }
      const roleCode = (code || name).toUpperCase().replace(/[^A-Z0-9]/g, '_');

      const existing = await Role.findOne({ where: { code: roleCode } });
      if (existing) {
        return res.status(400).json({ success: false, message: `Role code '${roleCode}' already exists` });
      }

      const role = await Role.create({
        code: roleCode,
        name: name.trim(),
        description: description?.trim() || 'Custom organizational role',
        permissions: Array.isArray(permissions) ? permissions : [],
        is_system: false,
      });

      auditService.logEvent({
        action: 'CREATE',
        entityType: 'ROLE',
        entityId: role.code,
        entityTitle: `${role.name} (${role.code})`,
        summary: `Created custom security role "${role.name}" with ${role.permissions.length} permissions.`,
        actorId: req.user?.id,
        actorName: req.user?.name,
        actorEmail: req.user?.email,
        actorRole: req.user?.role,
        severity: 'SUCCESS',
      });

      return sendSuccess(res, 'Role created successfully', {
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isSystem: false,
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * DELETE /users/roles/:code — delete a custom role from MySQL
   */
  async deleteRole(req, res, next) {
    try {
      const { code } = req.params;
      const role = await Role.findOne({ where: { code: code.toUpperCase() } });
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }
      if (role.is_system) {
        return res.status(400).json({ success: false, message: 'Cannot delete built-in system role' });
      }

      await role.destroy();

      auditService.logEvent({
        action: 'DELETE',
        entityType: 'ROLE',
        entityId: role.code,
        entityTitle: `${role.name} (${role.code})`,
        summary: `Deleted custom security role "${role.name}".`,
        actorId: req.user?.id,
        actorName: req.user?.name,
        actorEmail: req.user?.email,
        actorRole: req.user?.role,
        severity: 'WARNING',
      });

      return sendSuccess(res, `Role '${role.name}' deleted successfully`);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new UserController();
