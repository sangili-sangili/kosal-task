const { Model, DataTypes } = require('sequelize');

class Project extends Model {}

function initProjectModel(sequelize) {
  Project.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Project name is required' },
          len: { args: [2, 150], msg: 'Project name must be between 2 and 150 characters' },
        },
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Project location is required' },
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      cover_image: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'India',
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'Karnataka',
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'Bengaluru',
      },
      starting_price: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      price_range: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      possession_date: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Project',
      tableName: 'projects',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );

  return Project;
}

module.exports = {
  Project,
  initProjectModel,
};
