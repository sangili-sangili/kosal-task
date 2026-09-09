const { Model, DataTypes } = require('sequelize');

class Role extends Model {}

function initRoleModel(sequelize) {
  Role.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
          name: 'idx_roles_code',
          msg: 'Role code must be unique',
        },
        validate: {
          notEmpty: { msg: 'Role code is required' },
        },
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Role name is required' },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      permissions: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        get() {
          const raw = this.getDataValue('permissions');
          if (!raw) return [];
          if (Array.isArray(raw)) return raw;
          if (typeof raw === 'string') {
            try {
              const parsed = JSON.parse(raw);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          }
          return [];
        },
        set(value) {
          this.setDataValue('permissions', Array.isArray(value) ? value : []);
        },
      },
      is_system: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: 'Role',
      tableName: 'roles',
      underscored: true,
      timestamps: true,
      paranoid: false,
    }
  );

  return Role;
}

module.exports = {
  Role,
  initRoleModel,
};
