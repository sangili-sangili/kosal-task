const express = require('express');
const auditController = require('../controllers/audit.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { ForbiddenError } = require('../utils/errors');
const { Role } = require('../models');

const router = express.Router();

// Authenticate all audit routes
router.use(authMiddleware);

// Restrict audit endpoints to ADMIN or roles with 'audit:read' permission
const checkAuditPermission = async (req, res, next) => {
  try {
    const role = req.user?.role;
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return next();
    }

    if (!role) {
      return next(new ForbiddenError('Access Denied: You do not have permission to view audit logs'));
    }

    const roleDoc = await Role.findOne({ where: { code: role } });
    if (roleDoc && Array.isArray(roleDoc.permissions) && (roleDoc.permissions.includes('audit:read') || roleDoc.permissions.includes('*'))) {
      return next();
    }

    return next(new ForbiddenError('Access Denied: You do not have permission to view audit logs'));
  } catch (err) {
    return next(err);
  }
};

router.use(checkAuditPermission);

// GET /api/v1/audit/stats - summary metrics
router.get('/stats', (req, res, next) => auditController.getStats(req, res, next));

// GET /api/v1/audit - list with filtering & pagination
router.get('/', (req, res, next) => auditController.list(req, res, next));

// GET /api/v1/audit/:id - single record
router.get('/:id', (req, res, next) => auditController.getById(req, res, next));

// POST /api/v1/audit - create log
router.post('/', (req, res, next) => auditController.create(req, res, next));

module.exports = router;

