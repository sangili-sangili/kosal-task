const express = require('express');
const propertyController = require('../controllers/property.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/role.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const { ROLES } = require('../constants/roles');
const {
  createProjectSchema,
  updateProjectSchema,
  createBuildingSchema,
} = require('../validators/property.validator');

const router = express.Router();

router.use(authMiddleware);

/**
 * @route   GET /api/v1/projects
 * @desc    Get all property development projects
 * @access  Private (ADMIN, SALES)
 */
router.get('/', (req, res, next) => {
  return propertyController.getProjects(req, res, next);
});

/**
 * @route   POST /api/v1/projects
 * @desc    Create a new project
 * @access  Private (ADMIN, SALES)
 */
router.post('/', authorize(ROLES.ADMIN, ROLES.SALES), validationMiddleware(createProjectSchema), (req, res, next) => {
  return propertyController.createProject(req, res, next);
});

/**
 * @route   GET /api/v1/projects/:id
 * @desc    Get details of a single project with buildings
 * @access  Private (ADMIN, SALES)
 */
router.get('/:id', (req, res, next) => {
  return propertyController.getProjectById(req, res, next);
});

/**
 * @route   PATCH /api/v1/projects/:id
 * @desc    Update project
 * @access  Private (ADMIN, SALES)
 */
router.patch('/:id', authorize(ROLES.ADMIN, ROLES.SALES), validationMiddleware(updateProjectSchema), (req, res, next) => {
  return propertyController.updateProject(req, res, next);
});

/**
 * @route   DELETE /api/v1/projects/:id
 * @desc    Soft-delete project
 * @access  Private (ADMIN, SALES)
 */
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.SALES), (req, res, next) => {
  return propertyController.deleteProject(req, res, next);
});

// Nested Buildings under Projects
/**
 * @route   GET /api/v1/projects/:projectId/buildings
 * @desc    Get all towers/buildings for a project
 * @access  Private (ADMIN, SALES)
 */
router.get('/:projectId/buildings', (req, res, next) => {
  return propertyController.getBuildingsByProject(req, res, next);
});

/**
 * @route   POST /api/v1/projects/:projectId/buildings
 * @desc    Add a building to a project
 * @access  Private (ADMIN, SALES)
 */
router.post(
  '/:projectId/buildings',
  authorize(ROLES.ADMIN, ROLES.SALES),
  (req, res, next) => {
    return propertyController.createBuilding(req, res, next);
  }
);

module.exports = router;
