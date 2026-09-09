const { sequelize } = require('../config/database');
const { initUserModel } = require('./User');
const { initRoleModel } = require('./Role');
const { initPermissionModel } = require('./Permission');
const { initUserRoleModel } = require('./UserRole');
const { initRolePermissionModel } = require('./RolePermission');
const { initRefreshTokenModel } = require('./RefreshToken');
const { initCustomerModel } = require('./Customer');
const { initAccountModel } = require('./Account');
const { initAuditLogModel } = require('./AuditLog');

// Initialize models
const User = initUserModel(sequelize);
const Role = initRoleModel(sequelize);
const Permission = initPermissionModel(sequelize);
const UserRole = initUserRoleModel(sequelize);
const RolePermission = initRolePermissionModel(sequelize);
const RefreshToken = initRefreshTokenModel(sequelize);
const Customer = initCustomerModel(sequelize);
const Account = initAccountModel(sequelize);
const AuditLog = initAuditLogModel(sequelize);

// Define Associations
// User <-> Role (Many-to-Many)
User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: 'userId',
  otherKey: 'roleId',
  as: 'roles',
});
Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: 'roleId',
  otherKey: 'userId',
  as: 'users',
});

// Role <-> Permission (Many-to-Many)
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions',
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles',
});

// User -> RefreshTokens (One-to-Many)
User.hasMany(RefreshToken, {
  foreignKey: 'userId',
  as: 'refreshTokens',
  onDelete: 'CASCADE',
});
RefreshToken.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Customer -> Accounts (One-to-Many)
Customer.hasMany(Account, {
  foreignKey: 'customerId',
  as: 'accounts',
  onDelete: 'CASCADE',
});
Account.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer',
});

// User -> AuditLogs (One-to-Many)
User.hasMany(AuditLog, {
  foreignKey: 'userId',
  as: 'auditLogs',
});
AuditLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  RefreshToken,
  Customer,
  Account,
  AuditLog,
};
