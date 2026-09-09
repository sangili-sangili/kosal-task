const { sequelize, User, Role, Permission, UserRole, RolePermission, Customer, Account } = require('../models');
const { ROLES } = require('../constants/roles');
const { PERMISSIONS } = require('../constants/permissions');
const { hashPassword } = require('../utils/password');
const logger = require('../config/logger');

async function initializeDatabase() {
  try {
    logger.info('Synchronizing database schema and verifying tables...');
    // Sync models safely (alter: true in dev, never force in prod)
    await sequelize.sync({ alter: false });

    // Verify if Super Admin exists, if not, seed initial dataset
    const adminCount = await User.count();
    if (adminCount === 0) {
      logger.info('Database empty. Seeding essential roles, permissions, and super-admin user...');

      // 1. Roles
      const createdRoles = {};
      for (const roleName of Object.values(ROLES)) {
        const [role] = await Role.findOrCreate({
          where: { name: roleName },
          defaults: {
            name: roleName,
            description: `${roleName} role`,
            isSystem: true,
          },
        });
        createdRoles[roleName] = role;
      }

      // 2. Permissions
      const allPermissions = [];
      for (const permName of Object.values(PERMISSIONS)) {
        const [module] = permName.split(':');
        const [perm] = await Permission.findOrCreate({
          where: { name: permName },
          defaults: {
            name: permName,
            module: module || 'general',
            description: `Permission to ${permName}`,
          },
        });
        allPermissions.push(perm);
      }

      // 3. Assign all permissions to SUPER_ADMIN
      const superAdminRole = createdRoles[ROLES.SUPER_ADMIN];
      await superAdminRole.setPermissions(allPermissions);

      // 4. Create Super Admin User
      const hashedPassword = await hashPassword('Admin@123456');
      const adminUser = await User.create({
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@enterprise.com',
        password: hashedPassword,
        phone: '+1-555-0199',
        status: 'ACTIVE',
      });

      await adminUser.setRoles([superAdminRole]);

      // 5. Seed some sample customers and accounts for transaction demo
      const customer = await Customer.create({
        firstName: 'Alexander',
        lastName: 'Wright',
        email: 'alex.wright@acme.inc',
        phone: '+1-555-4820',
        company: 'Acme Corporation',
        status: 'ACTIVE',
      });

      await Account.create({
        customerId: customer.id,
        accountNumber: 'ACC-88492019',
        accountType: 'CHECKING',
        balance: 15450.00,
        currency: 'USD',
        status: 'ACTIVE',
      });

      logger.info('Essential seed data successfully provisioned! Default user: admin@enterprise.com / Admin@123456');
    } else {
      logger.info('Database already seeded. Skipping initial seeding.');
    }
  } catch (error) {
    logger.error('Error during database initialization:', error);
    throw error;
  }
}

module.exports = {
  initializeDatabase,
};
