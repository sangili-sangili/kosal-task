const { Model, DataTypes } = require('sequelize');

class Building extends Model {}

function initBuildingModel(sequelize) {
  Building.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      project_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id',
        },
        validate: {
          notNull: { msg: 'Project ID is required' },
        },
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Building name is required' },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Building',
      tableName: 'buildings',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );

  return Building;
}

module.exports = {
  Building,
  initBuildingModel,
};
