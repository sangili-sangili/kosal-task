const auditService = require('../services/audit.service');
const { sendSuccess } = require('../utils/response');

class AuditController {
  /**
   * GET /api/v1/audit
   * Retrieve paginated, searchable, filterable audit records + live KPI metrics
   */
  async list(req, res, next) {
    try {
      // Ensure seed data is present on first fetch
      await auditService.ensureSeedData();

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
      } = req.query;

      const [result, stats] = await Promise.all([
        auditService.getAuditLogs({
          page,
          limit,
          search,
          entityType,
          action,
          severity,
          startDate,
          endDate,
          sort,
          order,
        }),
        auditService.getAuditStats(),
      ]);

      return sendSuccess(res, 'Audit logs retrieved successfully', {
        logs: result.logs,
        pagination: result.pagination,
        stats,
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/v1/audit/stats
   * Retrieve live metrics summary
   */
  async getStats(req, res, next) {
    try {
      const stats = await auditService.getAuditStats();
      return sendSuccess(res, 'Audit metrics retrieved successfully', stats);
    } catch (err) {
      return next(err);
    }
  }

  /**
   * GET /api/v1/audit/:id
   * Retrieve single audit event detail
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const { AuditLog } = require('../models');
      const log = await AuditLog.findByPk(id);

      if (!log) {
        return res.status(404).json({
          success: false,
          message: 'Audit record not found',
        });
      }

      return sendSuccess(res, 'Audit record retrieved', log.toFrontendFormat());
    } catch (err) {
      return next(err);
    }
  }

  /**
   * POST /api/v1/audit
   * Record new audit event
   */
  async create(req, res, next) {
    try {
      const payload = {
        ...req.body,
        actorId: req.user?.id || req.body.actorId,
        actorName: req.user?.name || req.body.actorName,
        actorEmail: req.user?.email || req.body.actorEmail,
        actorRole: req.user?.role || req.body.actorRole,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
        device: req.headers['user-agent'] || 'Web Client',
      };

      const newLog = await auditService.logEvent(payload);
      return sendSuccess(res, 'Audit event recorded', newLog, 201);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new AuditController();
