const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

class AuditService {
  /**
   * Log an audit event
   */
  async logEvent(data) {
    try {
      let actorName = data.actorName || data.actor_name;
      let actorEmail = data.actorEmail || data.actor_email;
      let actorRole = data.actorRole || data.actor_role;
      const actorId = data.actorId || data.actor_id || null;

      if (actorId && (!actorName || !actorEmail)) {
        try {
          const user = await User.findByPk(actorId);
          if (user) {
            actorName = actorName || user.name;
            actorEmail = actorEmail || user.email;
            actorRole = actorRole || user.role;
          }
        } catch (e) {
          // ignore lookup failure
        }
      }

      const entry = await AuditLog.create({
        action: data.action || 'UPDATE',
        entity_type: data.entityType || data.entity_type || 'SYSTEM',
        entity_id: data.entityId ? String(data.entityId) : null,
        entity_title: data.entityTitle || data.entity_title || null,
        summary: data.summary || 'Activity recorded',
        actor_id: actorId,
        actor_name: actorName || 'System Administrator',
        actor_email: actorEmail || 'admin@crm.com',
        actor_role: actorRole || 'ADMIN',
        ip_address: data.ipAddress || data.ip_address || '127.0.0.1',
        device: data.device || 'Chrome 128 / Windows 11',
        severity: data.severity || 'INFO',
        details: data.details || null,
      });

      return entry.toFrontendFormat();
    } catch (err) {
      logger.error('Failed to write audit log entry:', err);
      // Non-blocking for primary application flow
      return null;
    }
  }

  /**
   * Query audit logs with search, filtering, and pagination
   */
  async getAuditLogs(params = {}) {
    const {
      page = 1,
      limit = 50,
      search,
      entityType,
      action,
      severity,
      startDate,
      endDate,
      sort = 'created_at',
      order = 'DESC',
    } = params;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (parsedPage - 1) * parsedLimit;

    const where = {};

    // Search term: matches summary, entityTitle, actorName, ipAddress
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { summary: { [Op.like]: q } },
        { entity_title: { [Op.like]: q } },
        { actor_name: { [Op.like]: q } },
        { ip_address: { [Op.like]: q } },
      ];
    }

    // Filter by entityType
    if (entityType && entityType !== 'ALL') {
      where.entity_type = entityType;
    }

    // Filter by action
    if (action && action !== 'ALL') {
      where.action = action;
    }

    // Filter by severity
    if (severity && severity !== 'ALL') {
      where.severity = severity;
    }

    // Date range filtering
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const sortField = ['created_at', 'action', 'entity_type', 'severity'].includes(sort)
      ? sort
      : 'created_at';
    const sortOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      order: [[sortField, sortOrder]],
      limit: parsedLimit,
      offset,
    });

    const formattedLogs = rows.map((row) => row.toFrontendFormat());

    return {
      logs: formattedLogs,
      pagination: {
        total: count,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(count / parsedLimit),
      },
    };
  }

  /**
   * Compute live audit metrics for KPI cards
   */
  async getAuditStats() {
    const totalEvents = await AuditLog.count();

    const securityEvents = await AuditLog.count({
      where: {
        [Op.or]: [
          { action: 'SECURITY' },
          { entity_type: 'ROLE' },
          { entity_type: 'SECURITY' },
        ],
      },
    });

    const financialEvents = await AuditLog.count({
      where: {
        [Op.or]: [
          { action: 'APPROVE' },
          { entity_type: 'BOOKING' },
        ],
      },
    });

    // Count distinct actors
    const actors = await AuditLog.findAll({
      attributes: ['actor_name'],
      group: ['actor_name'],
    });
    const distinctActors = actors.length;

    return {
      totalEvents,
      securityEvents,
      financialEvents,
      distinctActors,
    };
  }

  /**
   * Seed default realistic audit history if table is empty
   */
  async ensureSeedData() {
    const count = await AuditLog.count();
    if (count > 0) return;

    logger.info('Seeding realistic audit log trail into database...');

    const now = Date.now();
    const seeds = [
      {
        action: 'CREATE',
        entity_type: 'BOOKING',
        entity_id: 'BK-2026-001',
        entity_title: 'Unit 402 - Rajesh Singhania',
        summary: 'Booking token receipt confirmed with initial token amount of Rs. 2,00,000 via NEFT.',
        actor_name: 'Rahul Sharma',
        actor_email: 'rahul.sales@crm.com',
        actor_role: 'SALES',
        ip_address: '192.168.1.104',
        device: 'Chrome 128 / Windows 11',
        severity: 'SUCCESS',
        details: {
          bookingId: 'BK-2026-001',
          unitNumber: '402',
          tokenAmount: 200000,
          paymentMode: 'NEFT',
          leadName: 'Rajesh Singhania',
        },
        created_at: new Date(now - 12 * 60 * 1000),
      },
      {
        action: 'SECURITY',
        entity_type: 'ROLE',
        entity_id: 'role-admin',
        entity_title: 'ADMIN Role Security Matrix',
        summary: 'Permissions review and security baseline verification completed for Super Administrator profile.',
        actor_name: 'System Administrator',
        actor_email: 'admin@crm.com',
        actor_role: 'ADMIN',
        ip_address: '192.168.1.101',
        device: 'Firefox 130 / macOS Sonoma',
        severity: 'INFO',
        details: {
          role: 'ADMIN',
          verifiedPermissions: 27,
          enforceMfa: true,
        },
        created_at: new Date(now - 45 * 60 * 1000),
      },
      {
        action: 'UPDATE',
        entity_type: 'LEAD',
        entity_id: 'LD-104',
        entity_title: 'Vikram Malhotra',
        summary: 'Stage updated from Site Visit Scheduled to Negotiation with revised budget Rs. 1.8 Cr.',
        actor_name: 'Anjali Verma',
        actor_email: 'anjali.sales@crm.com',
        actor_role: 'SALES',
        ip_address: '192.168.1.112',
        device: 'Safari 17 / iPadOS',
        severity: 'INFO',
        details: {
          previousStage: 'SITE_VISIT',
          newStage: 'NEGOTIATION',
          revisedBudget: '1.8 Cr',
        },
        created_at: new Date(now - 90 * 60 * 1000),
      },
      {
        action: 'BLOCK',
        entity_type: 'UNIT',
        entity_id: 'UN-501',
        entity_title: 'Skyline Palms - Unit 501',
        summary: 'Unit reserved for 48 hours management hold pending VIP verification.',
        actor_name: 'System Administrator',
        actor_email: 'admin@crm.com',
        actor_role: 'ADMIN',
        ip_address: '192.168.1.101',
        device: 'Chrome 128 / Windows 11',
        severity: 'WARNING',
        details: {
          unitCode: 'SP-501',
          holdDurationHours: 48,
          reason: 'VIP Customer Verification',
        },
        created_at: new Date(now - 3 * 3600 * 1000),
      },
      {
        action: 'CREATE',
        entity_type: 'USER',
        entity_id: 'USR-3',
        entity_title: 'Anjali Verma (Sales Rep)',
        summary: 'New sales executive account provisioned and assigned to Residential Sector division.',
        actor_name: 'System Administrator',
        actor_email: 'admin@crm.com',
        actor_role: 'ADMIN',
        ip_address: '192.168.1.101',
        device: 'Chrome 128 / Windows 11',
        severity: 'SUCCESS',
        details: {
          email: 'anjali.sales@crm.com',
          role: 'SALES',
          assignedDivision: 'Residential Sector',
        },
        created_at: new Date(now - 5 * 3600 * 1000),
      },
      {
        action: 'EXPORT',
        entity_type: 'BOOKING',
        entity_id: 'EXP-902',
        entity_title: 'Q3 Financial Bookings Ledger',
        summary: 'Exported quarterly allotment report with 42 records for audit submission.',
        actor_name: 'System Administrator',
        actor_email: 'admin@crm.com',
        actor_role: 'ADMIN',
        ip_address: '192.168.1.101',
        device: 'Chrome 128 / Windows 11',
        severity: 'INFO',
        details: {
          exportedFormat: 'CSV',
          recordCount: 42,
          reportType: 'Q3 Financial Bookings Ledger',
        },
        created_at: new Date(now - 8 * 3600 * 1000),
      },
      {
        action: 'STAGE_CHANGE',
        entity_type: 'LEAD',
        entity_id: 'LD-102',
        entity_title: 'Pooja Nair',
        summary: 'Lead progressed to Site Visit Completed. Follow-up task scheduled for tomorrow morning.',
        actor_name: 'Rahul Sharma',
        actor_email: 'rahul.sales@crm.com',
        actor_role: 'SALES',
        ip_address: '192.168.1.104',
        device: 'Chrome 128 / Windows 11',
        severity: 'INFO',
        details: {
          previousStage: 'CONTACTED',
          newStage: 'SITE_VISIT_COMPLETED',
          nextFollowUp: 'Tomorrow 10:00 AM',
        },
        created_at: new Date(now - 14 * 3600 * 1000),
      },
      {
        action: 'APPROVE',
        entity_type: 'BOOKING',
        entity_id: 'BK-2026-003',
        entity_title: 'Green Valley Penthouse 12A',
        summary: 'Executive discount of 3.5% approved by Director. Final unit price locked.',
        actor_name: 'System Administrator',
        actor_email: 'admin@crm.com',
        actor_role: 'ADMIN',
        ip_address: '192.168.1.101',
        device: 'Chrome 128 / Windows 11',
        severity: 'SUCCESS',
        details: {
          unit: 'Penthouse 12A',
          discountPercentage: 3.5,
          approvedBy: 'Director',
        },
        created_at: new Date(now - 22 * 3600 * 1000),
      },
    ];

    for (const s of seeds) {
      await AuditLog.create(s);
    }
    logger.info('Audit log seeds successfully populated.');
  }
}

module.exports = new AuditService();
