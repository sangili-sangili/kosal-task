'use strict';

/**
 * Migration: Create Real Estate CRM Core Schema
 * Tables: users, projects, buildings, units, leads, lead_notes, lead_followups, bookings
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Users Table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(191),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('ADMIN', 'SALES'),
        allowNull: false,
        defaultValue: 'SALES',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.addIndex('users', ['email'], {
      name: 'idx_users_email',
      unique: true,
    });
    await queryInterface.addIndex('users', ['role'], {
      name: 'idx_users_role',
    });

    // 2. Projects Table
    await queryInterface.createTable('projects', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'ACTIVE',
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

    await queryInterface.addIndex('projects', ['status'], {
      name: 'idx_projects_status',
    });

    // 3. Buildings Table
    await queryInterface.createTable('buildings', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      project_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'projects', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('buildings', ['project_id'], {
      name: 'idx_buildings_project_id',
    });

    // 4. Units Table
    await queryInterface.createTable('units', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      building_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'buildings', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      unit_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      unit_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      floor: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      area: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('AVAILABLE', 'BOOKED', 'BLOCKED'),
        allowNull: false,
        defaultValue: 'AVAILABLE',
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

    // Unique unit per building constraint
    await queryInterface.addIndex('units', ['building_id', 'unit_number'], {
      name: 'idx_units_building_unit_number',
      unique: true,
    });
    await queryInterface.addIndex('units', ['building_id'], {
      name: 'idx_units_building_id',
    });
    await queryInterface.addIndex('units', ['status'], {
      name: 'idx_units_status',
    });
    // Composite index for fast inventory queries by building & availability
    await queryInterface.addIndex('units', ['building_id', 'status'], {
      name: 'idx_units_building_status',
    });

    // 5. Leads Table
    await queryInterface.createTable('leads', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(191),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(25),
        allowNull: false,
      },
      source: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Walk-in',
      },
      stage: {
        type: Sequelize.ENUM('NEW', 'CONTACTED', 'SITE_VISIT', 'INTERESTED', 'NEGOTIATION', 'BOOKED', 'LOST'),
        allowNull: false,
        defaultValue: 'NEW',
      },
      assigned_to: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      follow_up_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
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

    await queryInterface.addIndex('leads', ['stage'], {
      name: 'idx_leads_stage',
    });
    await queryInterface.addIndex('leads', ['assigned_to'], {
      name: 'idx_leads_assigned_to',
    });
    await queryInterface.addIndex('leads', ['follow_up_date'], {
      name: 'idx_leads_follow_up_date',
    });
    await queryInterface.addIndex('leads', ['phone'], {
      name: 'idx_leads_phone',
    });
    // Composite index for sales representative pipeline filtering
    await queryInterface.addIndex('leads', ['assigned_to', 'stage'], {
      name: 'idx_leads_assigned_stage',
    });

    // 6. Lead Notes Table
    await queryInterface.createTable('lead_notes', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      lead_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'leads', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: false,
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

    await queryInterface.addIndex('lead_notes', ['lead_id'], {
      name: 'idx_lead_notes_lead_id',
    });

    // 7. Lead Followups Table
    await queryInterface.createTable('lead_followups', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      lead_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'leads', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      assigned_to: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      follow_up_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      remarks: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('lead_followups', ['lead_id'], {
      name: 'idx_lead_followups_lead_id',
    });
    await queryInterface.addIndex('lead_followups', ['assigned_to'], {
      name: 'idx_lead_followups_assigned_to',
    });
    await queryInterface.addIndex('lead_followups', ['status', 'follow_up_date'], {
      name: 'idx_lead_followups_status_date',
    });

    // 8. Bookings Table
    await queryInterface.createTable('bookings', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      booking_reference: {
        type: Sequelize.STRING(60),
        allowNull: false,
        unique: true,
      },
      lead_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'leads', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      unit_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'units', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      booked_by: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      booking_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('CONFIRMED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'CONFIRMED',
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

    await queryInterface.addIndex('bookings', ['booking_reference'], {
      name: 'idx_bookings_booking_reference',
      unique: true,
    });
    await queryInterface.addIndex('bookings', ['unit_id'], {
      name: 'idx_bookings_unit_id',
    });
    await queryInterface.addIndex('bookings', ['lead_id'], {
      name: 'idx_bookings_lead_id',
    });
    await queryInterface.addIndex('bookings', ['status'], {
      name: 'idx_bookings_status',
    });
    // Composite index for fast lookup of active unit bookings
    await queryInterface.addIndex('bookings', ['unit_id', 'status'], {
      name: 'idx_bookings_unit_status',
    });
  },

  async down(queryInterface) {
    // Reverse drop in reverse order of foreign key dependency
    await queryInterface.dropTable('bookings');
    await queryInterface.dropTable('lead_followups');
    await queryInterface.dropTable('lead_notes');
    await queryInterface.dropTable('leads');
    await queryInterface.dropTable('units');
    await queryInterface.dropTable('buildings');
    await queryInterface.dropTable('projects');
    await queryInterface.dropTable('users');
  },
};
