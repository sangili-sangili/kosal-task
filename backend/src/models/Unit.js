const { Model, DataTypes } = require('sequelize');
const { UNIT_STATUS, UNIT_STATUS_VALUES } = require('../constants/unitStatus');

class Unit extends Model {
  /**
   * Check if the unit is currently available for reservation
   */
  isAvailable() {
    return this.status === UNIT_STATUS.AVAILABLE;
  }
}

function initUnitModel(sequelize) {
  Unit.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      building_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'buildings',
          key: 'id',
        },
        validate: {
          notNull: { msg: 'Building ID is required' },
        },
      },
      unit_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Unit number is required' },
        },
      },
      unit_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Unit type (e.g., 2BHK, 3BHK) is required' },
        },
      },
      floor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isInt: { msg: 'Floor must be an integer' },
        },
      },
      area: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Area must be a valid number' },
          min: { args: [1], msg: 'Area must be greater than 0' },
        },
      },
      price: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Price must be a valid decimal amount' },
          min: { args: [0], msg: 'Price cannot be negative' },
        },
      },
      facing: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'East',
        validate: {
          len: { args: [0, 50], msg: 'Facing description cannot exceed 50 characters' },
        },
      },
      status: {
        type: DataTypes.ENUM(...UNIT_STATUS_VALUES),
        allowNull: false,
        defaultValue: UNIT_STATUS.AVAILABLE,
        validate: {
          isIn: {
            args: [UNIT_STATUS_VALUES],
            msg: `Status must be one of: ${UNIT_STATUS_VALUES.join(', ')}`,
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'Unit',
      tableName: 'units',
      underscored: true,
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ['building_id', 'unit_number'],
          name: 'idx_units_building_unit_number',
        },
      ],
      scopes: {
        available: {
          where: { status: UNIT_STATUS.AVAILABLE },
        },
        booked: {
          where: { status: UNIT_STATUS.BOOKED },
        },
        blocked: {
          where: { status: UNIT_STATUS.BLOCKED },
        },
      },
    }
  );

  return Unit;
}

module.exports = {
  Unit,
  initUnitModel,
};
