'use strict';

/**
 * Migration: Create Audit Logs Table
 * Tracks chronological system events, actor activities, entity mutations, and security operations
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((t) => (typeof t === 'object' && t.tableName ? t.tableName : t));

    if (!tableNames.includes('audit_logs')) {
      await queryInterface.createTable('audit_logs', {
        id: {
          type: Sequelize.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        action: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'UPDATE',
        },
        entity_type: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'SYSTEM',
        },
        entity_id: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        entity_title: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        summary: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        actor_id: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        actor_name: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        actor_email: {
          type: Sequelize.STRING(191),
          allowNull: true,
        },
        actor_role: {
          type: Sequelize.STRING(50),
          allowNull: true,
        },
        ip_address: {
          type: Sequelize.STRING(45),
          allowNull: true,
          defaultValue: '127.0.0.1',
        },
        device: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        severity: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: 'INFO',
        },
        details: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
      });

      try {
        await queryInterface.addIndex('audit_logs', ['created_at'], { name: 'idx_audit_logs_created_at' });
        await queryInterface.addIndex('audit_logs', ['action'], { name: 'idx_audit_logs_action' });
        await queryInterface.addIndex('audit_logs', ['entity_type'], { name: 'idx_audit_logs_entity_type' });
        await queryInterface.addIndex('audit_logs', ['actor_id'], { name: 'idx_audit_logs_actor_id' });
        await queryInterface.addIndex('audit_logs', ['severity'], { name: 'idx_audit_logs_severity' });
      } catch (e) {
        // Continue if index already exists
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_logs');
  },
};
