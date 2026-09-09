const express = require('express');
const leadController = require('../controllers/lead.controller');
const leadActivityController = require('../controllers/leadActivity.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const { ROLES } = require('../constants/roles');
const {
  createLeadSchema,
  updateLeadSchema,
  updateStageSchema,
} = require('../validators/lead.validator');
const {
  createNoteSchema,
  createFollowupSchema,
  updateFollowupStatusSchema,
} = require('../validators/noteFollowup.validator');

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

// ==========================================
// LEAD NOTES ENDPOINTS (Phase 9)
// ==========================================

/**
 * @route   POST /api/v1/leads/:id/notes
 * @desc    Add a note to a lead prospect
 * @access  Private (ADMIN, SALES - scoped)
 */
router.post('/:id/notes', validationMiddleware(createNoteSchema), (req, res, next) => {
  return leadActivityController.addNote(req, res, next);
});

/**
 * @route   GET /api/v1/leads/:id/notes
 * @desc    Get all notes for a lead
 * @access  Private (ADMIN, SALES - scoped)
 */
router.get('/:id/notes', (req, res, next) => {
  return leadActivityController.getNotes(req, res, next);
});

// ==========================================
// LEAD FOLLOW-UPS ENDPOINTS (Phase 9)
// ==========================================

/**
 * @route   POST /api/v1/leads/:id/followups
 * @desc    Schedule a follow-up for a lead
 * @access  Private (ADMIN, SALES - scoped)
 */
router.post('/:id/followups', validationMiddleware(createFollowupSchema), (req, res, next) => {
  return leadActivityController.addFollowup(req, res, next);
});

/**
 * @route   GET /api/v1/leads/:id/followups
 * @desc    Get all follow-ups for a lead
 * @access  Private (ADMIN, SALES - scoped)
 */
router.get('/:id/followups', (req, res, next) => {
  return leadActivityController.getFollowups(req, res, next);
});

/**
 * @route   PATCH /api/v1/leads/:id/followups/:followupId
 * @desc    Update status of a follow-up
 * @access  Private (ADMIN, SALES - scoped)
 */
router.patch(
  '/:id/followups/:followupId',
  validationMiddleware(updateFollowupStatusSchema),
  (req, res, next) => {
    return leadActivityController.updateFollowupStatus(req, res, next);
  }
);

module.exports = router;
