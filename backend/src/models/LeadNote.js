const { Model, DataTypes } = require('sequelize');

class LeadNote extends Model {}

function initLeadNoteModel(sequelize) {
  LeadNote.init(
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
      user_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Note content cannot be empty' },
        },
      },
    },
    {
      sequelize,
      modelName: 'LeadNote',
      tableName: 'lead_notes',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );

  return LeadNote;
}

module.exports = {
  LeadNote,
  initLeadNoteModel,
};
