const { DataTypes, Model } = require('sequelize');

class Permission extends Model {}

function initPermissionModel(sequelize) {
  Permission.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      module: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Permission',
      tableName: 'permissions',
      timestamps: true,
      paranoid: false,
    }
  );

  return Permission;
}

module.exports = {
  Permission,
  initPermissionModel,
};
