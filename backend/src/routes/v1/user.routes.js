const express = require('express');
const userController = require('../../controllers/user.controller');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/rbac.middleware');
const validate = require('../../middlewares/validate.middleware');
const { ROLES } = require('../../constants/roles');
const {
  createUserSchema,
  updateUserSchema,
  getUserListSchema,
  userIdParamSchema,
} = require('../../validators/user.validator');

const router = express.Router();

// All user management routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/users/roles/all
 * @desc Get list of roles
 * @access Private (Admin, Manager)
 */
router.get(
  '/roles/all',
  authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]),
  userController.getRoles
);

/**
 * @route GET /api/v1/users
 * @desc List users with pagination, filters, and search
 * @access Private (Admin, Manager)
 */
router.get(
  '/',
  authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]),
  validate(getUserListSchema),
  userController.getUsers
);

/**
 * @route GET /api/v1/users/:id
 * @desc Get user by ID
 * @access Private
 */
router.get(
  '/:id',
  validate(userIdParamSchema),
  userController.getUserById
);

/**
 * @route POST /api/v1/users
 * @desc Create a new user
 * @access Private (Super Admin, Admin)
 */
router.post(
  '/',
  authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  validate(createUserSchema),
  userController.createUser
);

/**
 * @route PUT /api/v1/users/:id
 * @desc Update an existing user
 * @access Private (Super Admin, Admin)
 */
router.put(
  '/:id',
  authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  validate(updateUserSchema),
  userController.updateUser
);

/**
 * @route DELETE /api/v1/users/:id
 * @desc Soft-delete a user
 * @access Private (Super Admin, Admin)
 */
router.delete(
  '/:id',
  authorize([ROLES.SUPER_ADMIN, ROLES.ADMIN]),
  validate(userIdParamSchema),
  userController.deleteUser
);

module.exports = router;
