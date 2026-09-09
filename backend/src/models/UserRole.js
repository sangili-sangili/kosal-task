const { DataTypes, Model } = require('sequelize');

class UserRole extends Model {}

function initUserRoleModel(sequelize) {
  UserRole.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
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
    },
    {
      sequelize,
      modelName: 'UserRole',
      tableName: 'user_roles',
      timestamps: true,
      paranoid: false,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'role_id'],
        },
      ],
    }
  );

  return UserRole;
}

module.exports = {
  UserRole,
  initUserRoleModel,
};
