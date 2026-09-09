const { DataTypes, Model } = require('sequelize');

class AuditLog extends Model {}

function initAuditLogModel(sequelize) {
  AuditLog.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        field: 'user_id',
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      entity: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      entityId: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'entity_id',
      },
      details: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'ip_address',
      },
    },
    {
      sequelize,
      modelName: 'AuditLog',
      tableName: 'audit_logs',
      timestamps: true,
      updatedAt: false, // Audit logs are immutable append-only
      paranoid: false,
      indexes: [
        {
          fields: ['user_id', 'created_at'],
        },
        {
          fields: ['entity', 'entity_id'],
        },
      ],
    }
  );

  return AuditLog;
}

module.exports = {
  AuditLog,
  initAuditLogModel,
};
