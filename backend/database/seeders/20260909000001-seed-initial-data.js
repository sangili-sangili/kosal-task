'use strict';

const bcrypt = require('bcryptjs');
const { ROLES } = require('../../src/constants/roles');
const { PERMISSIONS } = require('../../src/constants/permissions');

module.exports = {
  async up(queryInterface) {
    const timestamp = new Date();

    // 1. Seed Roles
    const rolesData = [
      { id: 1, name: ROLES.SUPER_ADMIN, description: 'Super Administrator with full access', is_system: true, created_at: timestamp, updated_at: timestamp },
      { id: 2, name: ROLES.ADMIN, description: 'System Administrator with management privileges', is_system: true, created_at: timestamp, updated_at: timestamp },
      { id: 3, name: ROLES.MANAGER, description: 'Branch / Department Manager', is_system: true, created_at: timestamp, updated_at: timestamp },
      { id: 4, name: ROLES.STAFF, description: 'Operational Staff member', is_system: true, created_at: timestamp, updated_at: timestamp },
      { id: 5, name: ROLES.CUSTOMER, description: 'Standard Customer', is_system: true, created_at: timestamp, updated_at: timestamp },
    ];
    await queryInterface.bulkInsert('roles', rolesData, {});

    // 2. Seed Permissions
    const permissionsData = Object.values(PERMISSIONS).map((permName, index) => {
      const [module] = permName.split(':');
      return {
        id: index + 1,
        name: permName,
        module: module || 'general',
        description: `Permission for ${permName}`,
        created_at: timestamp,
        updated_at: timestamp,
      };
    });
    await queryInterface.bulkInsert('permissions', permissionsData, {});

    // 3. Assign all permissions to SUPER_ADMIN (role id 1)
    const rolePermissionsData = permissionsData.map((perm) => ({
      role_id: 1,
      permission_id: perm.id,
      created_at: timestamp,
      updated_at: timestamp,
    }));
    await queryInterface.bulkInsert('role_permissions', rolePermissionsData, {});

    // 4. Seed Super Admin User (password: Admin@123456)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Admin@123456', salt);

    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        uuid: '11111111-2222-3333-4444-555555555555',
        first_name: 'Super',
        last_name: 'Admin',
        email: 'admin@enterprise.com',
        password: hashedPassword,
        phone: '+1-555-0199',
        status: 'ACTIVE',
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]);

    // 5. Assign SUPER_ADMIN role to user 1
    await queryInterface.bulkInsert('user_roles', [
      {
        id: 1,
        user_id: 1,
        role_id: 1,
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('user_roles', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('role_permissions', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  },
};
