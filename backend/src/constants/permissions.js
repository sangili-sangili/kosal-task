const PERMISSIONS = Object.freeze({
  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Role Management
  ROLE_READ: 'role:read',
  ROLE_MANAGE: 'role:manage',

  // Customer Management
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_READ: 'customer:read',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',

  // Transaction Management
  TRANSACTION_CREATE: 'transaction:create',
  TRANSACTION_READ: 'transaction:read',

  // Audit Logs
  AUDIT_READ: 'audit:read',
});

module.exports = {
  PERMISSIONS,
};
