const { DataTypes, Model } = require('sequelize');

class RolePermission extends Model {}

function initRolePermissionModel(sequelize) {
  RolePermission.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      roleId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'role_id',
        references: {
          model: 'roles',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      permissionId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'permission_id',
        references: {
          model: 'permissions',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
    },
    {
      sequelize,
      modelName: 'RolePermission',
      tableName: 'role_permissions',
      timestamps: true,
      paranoid: false,
      indexes: [
        {
          unique: true,
          fields: ['role_id', 'permission_id'],
        },
      ],
    }
  );

  return RolePermission;
}

module.exports = {
  RolePermission,
  initRolePermissionModel,
};
