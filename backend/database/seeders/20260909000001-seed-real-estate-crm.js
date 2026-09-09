'use strict';

const bcrypt = require('bcryptjs');

/**
 * Real Estate CRM Production Seed Data
 * Populates Users, Projects, Buildings, Units, Leads, Notes, Follow-ups, and Bookings
 */
module.exports = {
  async up(queryInterface) {
    const timestamp = new Date();
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('Password@1234', salt);

    // Clean existing records in reverse foreign-key order to ensure clean idempotent seeding
    await queryInterface.bulkDelete('bookings', null, {});
    await queryInterface.bulkDelete('lead_followups', null, {});
    await queryInterface.bulkDelete('lead_notes', null, {});
    await queryInterface.bulkDelete('leads', null, {});
    await queryInterface.bulkDelete('units', null, {});
    await queryInterface.bulkDelete('buildings', null, {});
    await queryInterface.bulkDelete('projects', null, {});
    await queryInterface.bulkDelete('users', null, {});

    // 1. Seed Users (1 Admin, 2 Sales Representatives)
    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        name: 'System Administrator',
        email: 'admin@crm.com',
        password_hash: defaultPassword,
        role: 'ADMIN',
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 2,
        name: 'Rahul Sharma',
        email: 'rahul.sales@crm.com',
        password_hash: defaultPassword,
        role: 'SALES',
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 3,
        name: 'Anjali Verma',
        email: 'anjali.sales@crm.com',
        password_hash: defaultPassword,
        role: 'SALES',
        is_active: true,
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]);

    // 2. Seed Projects
    await queryInterface.bulkInsert('projects', [
      {
        id: 1,
        name: 'Grand Imperial Heights',
        location: 'Whitefield, Bengaluru',
        description: 'Ultra-luxury 28-storey high-rise towers with private sky lounge and Olympic pool',
        status: 'ACTIVE',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 2,
        name: 'Greenfield Valley Residences',
        location: 'Electronic City, Bengaluru',
        description: 'Eco-conscious sustainable luxury residences surrounded by serene green parks',
        status: 'ACTIVE',
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]);

    // 3. Seed Buildings / Towers
    await queryInterface.bulkInsert('buildings', [
      {
        id: 1,
        project_id: 1,
        name: 'Tower A - Emerald',
        description: 'East-facing luxury residences with city panorama',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 2,
        project_id: 1,
        name: 'Tower B - Sapphire',
        description: 'Clubhouse and infinity pool facing executive residences',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 3,
        project_id: 2,
        name: 'Cedar Block',
        description: 'Central park and botanical garden facing residences',
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]);

    // 4. Seed Inventory Units
    await queryInterface.bulkInsert('units', [
      // Tower A Units
      {
        id: 1,
        building_id: 1,
        unit_number: 'A-101',
        unit_type: '3BHK',
        floor: 1,
        area: 1650.0,
        price: 12500000.0,
        status: 'AVAILABLE',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 2,
        building_id: 1,
        unit_number: 'A-102',
        unit_type: '2BHK',
        floor: 1,
        area: 1250.0,
        price: 9500000.0,
        status: 'AVAILABLE',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 3,
        building_id: 1,
        unit_number: 'A-201',
        unit_type: '3BHK',
        floor: 2,
        area: 1650.0,
        price: 12800000.0,
        status: 'BOOKED',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 4,
        building_id: 1,
        unit_number: 'A-202',
        unit_type: '2BHK',
        floor: 2,
        area: 1250.0,
        price: 9800000.0,
        status: 'AVAILABLE',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 5,
        building_id: 1,
        unit_number: 'A-301',
        unit_type: '4BHK',
        floor: 3,
        area: 2400.0,
        price: 21000000.0,
        status: 'AVAILABLE',
        created_at: timestamp,
        updated_at: timestamp,
      },
      // Tower B Units
      {
        id: 6,
        building_id: 2,
        unit_number: 'B-101',
        unit_type: '2BHK',
        floor: 1,
        area: 1200.0,
        price: 9200000.0,
        status: 'AVAILABLE',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 7,
        building_id: 2,
        unit_number: 'B-102',
        unit_type: '3BHK',
        floor: 1,
        area: 1600.0,
        price: 12200000.0,
        status: 'BLOCKED',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 8,
        building_id: 2,
        unit_number: 'B-201',
        unit_type: '3BHK',
        floor: 2,
        area: 1600.0,
        price: 12500000.0,
        status: 'AVAILABLE',
        created_at: timestamp,
        updated_at: timestamp,
      },
      // Cedar Block Units
      {
        id: 9,
        building_id: 3,
        unit_number: 'C-101',
        unit_type: '2BHK',
        floor: 1,
        area: 1100.0,
        price: 7800000.0,
        status: 'AVAILABLE',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 10,
        building_id: 3,
        unit_number: 'C-102',
        unit_type: '3BHK',
        floor: 1,
        area: 1500.0,
        price: 10500000.0,
        status: 'AVAILABLE',
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]);

    // 5. Seed Leads
    await queryInterface.bulkInsert('leads', [
      {
        id: 1,
        name: 'Vikram Malhotra',
        email: 'vikram.m@example.com',
        phone: '+919876511001',
        source: 'Website',
        stage: 'NEW',
        assigned_to: 2,
        created_by: 1,
        follow_up_date: '2026-10-12',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 2,
        name: 'Meera Nambiar',
        email: 'meera.n@example.com',
        phone: '+919876511002',
        source: 'Walk-in',
        stage: 'CONTACTED',
        assigned_to: 2,
        created_by: 2,
        follow_up_date: '2026-10-15',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 3,
        name: 'Siddharth Roy',
        email: 'siddharth.r@example.com',
        phone: '+919876511003',
        source: 'Referral',
        stage: 'SITE_VISIT',
        assigned_to: 3,
        created_by: 3,
        follow_up_date: '2026-10-18',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 4,
        name: 'Divya Krishnan',
        email: 'divya.k@example.com',
        phone: '+919876511004',
        source: 'Social Media',
        stage: 'INTERESTED',
        assigned_to: 3,
        created_by: 3,
        follow_up_date: '2026-10-20',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 5,
        name: 'Arunav Sengupta',
        email: 'arunav.s@example.com',
        phone: '+919876511005',
        source: 'Website',
        stage: 'NEGOTIATION',
        assigned_to: 2,
        created_by: 2,
        follow_up_date: '2026-10-22',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 6,
        name: 'Rajesh & Sangeeta Iyer',
        email: 'rajesh.iyer@example.com',
        phone: '+919876511006',
        source: 'Walk-in',
        stage: 'BOOKED',
        assigned_to: 2,
        created_by: 2,
        follow_up_date: null,
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]);

    // 6. Seed Lead Notes
    await queryInterface.bulkInsert('lead_notes', [
      {
        id: 1,
        lead_id: 2,
        user_id: 2,
        note: 'Customer inquired about 2BHK units on middle floors with park view.',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 2,
        lead_id: 3,
        user_id: 3,
        note: 'Site visit completed on Saturday. Customer very impressed with clubhouse and sports arena.',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 3,
        lead_id: 5,
        user_id: 2,
        note: 'Price negotiation underway for 3BHK unit. Customer requested 2% festive discount.',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 4,
        lead_id: 6,
        user_id: 2,
        note: 'Booking advance token received. Agreement signing scheduled next week.',
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]);

    // 7. Seed Lead Follow-ups
    await queryInterface.bulkInsert('lead_followups', [
      {
        id: 1,
        lead_id: 3,
        assigned_to: 3,
        follow_up_date: new Date('2026-10-18T10:00:00.000Z'),
        status: 'PENDING',
        remarks: 'Follow up on unit floor preference and bank loan eligibility documents.',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 2,
        lead_id: 4,
        assigned_to: 3,
        follow_up_date: new Date('2026-10-20T15:30:00.000Z'),
        status: 'PENDING',
        remarks: 'Arrange second site visit with spouse.',
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        id: 3,
        lead_id: 5,
        assigned_to: 2,
        follow_up_date: new Date('2026-10-22T11:00:00.000Z'),
        status: 'PENDING',
        remarks: 'Finalize payment milestone schedule and close negotiation.',
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]);

    // 8. Seed Bookings
    await queryInterface.bulkInsert('bookings', [
      {
        id: 1,
        booking_reference: 'BK-2026-000101',
        lead_id: 6,
        unit_id: 3,
        booked_by: 2,
        booking_date: timestamp,
        amount: 12800000.0,
        status: 'CONFIRMED',
        created_at: timestamp,
        updated_at: timestamp,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('bookings', null, {});
    await queryInterface.bulkDelete('lead_followups', null, {});
    await queryInterface.bulkDelete('lead_notes', null, {});
    await queryInterface.bulkDelete('leads', null, {});
    await queryInterface.bulkDelete('units', null, {});
    await queryInterface.bulkDelete('buildings', null, {});
    await queryInterface.bulkDelete('projects', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
