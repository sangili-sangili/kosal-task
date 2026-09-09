const { Model, DataTypes } = require('sequelize');

class AuditLog extends Model {
  /**
   * Helper to format audit log for API / frontend consumption
   */
  toFrontendFormat() {
    const raw = this.toJSON();
    const actorName = raw.actor_name || raw.actor?.name || 'System';
    const actorRole = raw.actor_role || raw.actor?.role || 'SYSTEM';
    const actorEmail = raw.actor_email || raw.actor?.email || 'system@crm.internal';

    // Compute initials for avatar
    const initials = actorName
      .split(' ')
      .map((p) => p[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'SY';

    return {
      id: raw.id,
      timestamp: raw.created_at || raw.createdAt,
      action: raw.action,
      entityType: raw.entity_type,
      entityId: raw.entity_id,
      entityTitle: raw.entity_title,
      summary: raw.summary,
      actor: {
        id: raw.actor_id,
        name: actorName,
        email: actorEmail,
        role: actorRole,
        avatar: initials,
      },
      ipAddress: raw.ip_address || '127.0.0.1',
      device: raw.device || 'Web Client',
      severity: raw.severity || 'INFO',
      details: raw.details || null,
    };
  }
}

function initAuditLogModel(sequelize) {
  AuditLog.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'UPDATE',
      },
      entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'SYSTEM',
      },
      entity_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      entity_title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      summary: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      actor_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      actor_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      actor_email: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      actor_role: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
        defaultValue: '127.0.0.1',
      },
      device: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      severity: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'INFO',
      },
      details: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'AuditLog',
      tableName: 'audit_logs',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  return AuditLog;
}

module.exports = {
  AuditLog,
  initAuditLogModel,
};
