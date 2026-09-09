const { Model, DataTypes } = require('sequelize');
const { LEAD_STAGES, LEAD_STAGE_VALUES } = require('../constants/leadStages');

class Lead extends Model {
  /**
   * Check if the lead is eligible for a booking reservation
   */
  canBeBooked() {
    return this.stage !== LEAD_STAGES.LOST;
  }
}

function initLeadModel(sequelize) {
  Lead.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Lead prospect name is required' },
          len: { args: [2, 100], msg: 'Lead name must be between 2 and 100 characters' },
        },
      },
      email: {
        type: DataTypes.STRING(191),
        allowNull: true,
        validate: {
          isEmail: { msg: 'Must be a valid email address' },
        },
      },
      phone: {
        type: DataTypes.STRING(25),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Phone number is required' },
        },
      },
      source: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'Walk-in',
      },
      stage: {
        type: DataTypes.ENUM(...LEAD_STAGE_VALUES),
        allowNull: false,
        defaultValue: LEAD_STAGES.NEW,
        validate: {
          isIn: {
            args: [LEAD_STAGE_VALUES],
            msg: `Stage must be one of: ${LEAD_STAGE_VALUES.join(', ')}`,
          },
        },
      },
      assigned_to: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      follow_up_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'Lead',
      tableName: 'leads',
      underscored: true,
      timestamps: true,
      paranoid: true,
      scopes: {
        active: {
          where: {
            stage: [
              LEAD_STAGES.NEW,
              LEAD_STAGES.CONTACTED,
              LEAD_STAGES.SITE_VISIT,
              LEAD_STAGES.INTERESTED,
              LEAD_STAGES.NEGOTIATION,
            ],
          },
        },
      },
    }
  );

  return Lead;
}

module.exports = {
  Lead,
  initLeadModel,
};
