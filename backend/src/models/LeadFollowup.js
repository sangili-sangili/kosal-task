const { Model, DataTypes } = require('sequelize');

const FOLLOWUP_STATUS = Object.freeze({
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

class LeadFollowup extends Model {}

function initLeadFollowupModel(sequelize) {
  LeadFollowup.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      lead_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'leads',
          key: 'id',
        },
        validate: {
          notNull: { msg: 'Lead ID is required' },
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
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: { msg: 'Follow-up date must be a valid date' },
        },
      },
      status: {
        type: DataTypes.ENUM(FOLLOWUP_STATUS.PENDING, FOLLOWUP_STATUS.COMPLETED, FOLLOWUP_STATUS.CANCELLED),
        allowNull: false,
        defaultValue: FOLLOWUP_STATUS.PENDING,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'LeadFollowup',
      tableName: 'lead_followups',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );

  return LeadFollowup;
}

module.exports = {
  LeadFollowup,
  FOLLOWUP_STATUS,
  initLeadFollowupModel,
};
