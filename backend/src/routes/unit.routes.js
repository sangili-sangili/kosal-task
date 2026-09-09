const express = require('express');
const propertyController = require('../controllers/property.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const { ROLES } = require('../constants/roles');
const {
  createUnitSchema,
  updateUnitSchema,
} = require('../validators/property.validator');

const router = express.Router();

router.use(authMiddleware);

/**
 * @route   GET /api/v1/units
 * @desc    Get paginated units with inventory filters (status, BHK, price range, project, building)
 * @access  Private (ADMIN, SALES)
 */
router.get('/', (req, res, next) => {
  return propertyController.getUnits(req, res, next);
});

/**
 * @route   POST /api/v1/units
 * @desc    Create a new inventory unit in a building
 * @access  Private (ADMIN only)
 */
router.post('/', authorize(ROLES.ADMIN), validationMiddleware(createUnitSchema), (req, res, next) => {
  return propertyController.createUnit(req, res, next);
});

/**
 * @route   GET /api/v1/units/:id
 * @desc    Get details of a single unit
 * @access  Private (ADMIN, SALES)
 */
router.get('/:id', (req, res, next) => {
  return propertyController.getUnitById(req, res, next);
});

/**
 * @route   PATCH /api/v1/units/:id
 * @desc    Update unit details
 * @access  Private (ADMIN only)
 */
router.patch('/:id', authorize(ROLES.ADMIN), validationMiddleware(updateUnitSchema), (req, res, next) => {
  return propertyController.updateUnit(req, res, next);
});

/**
 * @route   DELETE /api/v1/units/:id
 * @desc    Soft-delete unit
 * @access  Private (ADMIN only)
 */
router.delete('/:id', authorize(ROLES.ADMIN), (req, res, next) => {
  return propertyController.deleteUnit(req, res, next);
});

module.exports = router;
