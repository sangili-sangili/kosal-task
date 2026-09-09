const express = require('express');
const auditController = require('../controllers/audit.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Authenticate all audit routes
router.use(authMiddleware);

// GET /api/v1/audit/stats - summary metrics
router.get('/stats', (req, res, next) => auditController.getStats(req, res, next));

// GET /api/v1/audit - list with filtering & pagination
router.get('/', (req, res, next) => auditController.list(req, res, next));

// GET /api/v1/audit/:id - single record
router.get('/:id', (req, res, next) => auditController.getById(req, res, next));

// POST /api/v1/audit - create log
router.post('/', (req, res, next) => auditController.create(req, res, next));

module.exports = router;
