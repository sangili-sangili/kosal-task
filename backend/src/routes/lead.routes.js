const express = require('express');
const leadController = require('../controllers/lead.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const { ROLES } = require('../constants/roles');
const {
  createLeadSchema,
  updateLeadSchema,
  updateStageSchema,
} = require('../validators/lead.validator');

const router = express.Router();

// Require authentication for all lead routes
router.use(authMiddleware);

/**
 * @route   POST /api/v1/leads
 * @desc    Create a new prospective lead
 * @access  Private (ADMIN, SALES)
 */
router.post('/', validationMiddleware(createLeadSchema), (req, res, next) => {
  return leadController.create(req, res, next);
});

/**
 * @route   GET /api/v1/leads
 * @desc    Get paginated leads (scoped to sales rep if not admin)
 * @access  Private (ADMIN, SALES)
 */
router.get('/', (req, res, next) => {
  return leadController.list(req, res, next);
});

/**
 * @route   GET /api/v1/leads/:id
 * @desc    Get details of a single lead
 * @access  Private (ADMIN, SALES - scoped)
 */
router.get('/:id', (req, res, next) => {
  return leadController.getById(req, res, next);
});

/**
 * @route   PATCH /api/v1/leads/:id
 * @desc    Update lead details
 * @access  Private (ADMIN, SALES - scoped)
 */
router.patch('/:id', validationMiddleware(updateLeadSchema), (req, res, next) => {
  return leadController.update(req, res, next);
});

/**
 * @route   PATCH /api/v1/leads/:id/stage
 * @desc    Update lead pipeline stage
 * @access  Private (ADMIN, SALES - scoped)
 */
router.patch('/:id/stage', validationMiddleware(updateStageSchema), (req, res, next) => {
  return leadController.updateStage(req, res, next);
});

/**
 * @route   DELETE /api/v1/leads/:id
 * @desc    Soft-delete lead
 * @access  Private (ADMIN only)
 */
router.delete('/:id', authorize(ROLES.ADMIN), (req, res, next) => {
  return leadController.delete(req, res, next);
});

module.exports = router;
