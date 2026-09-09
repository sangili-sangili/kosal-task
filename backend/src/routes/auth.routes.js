const express = require('express');
const authController = require('../controllers/auth.controller');
const validationMiddleware = require('../middlewares/validation.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const { loginSchema, createUserSchema } = require('../validators/auth.validator');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
router.post('/login', validationMiddleware(loginSchema), (req, res, next) => {
  return authController.login(req, res, next);
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/register', validationMiddleware(createUserSchema), (req, res, next) => {
  return authController.register(req, res, next);
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently authenticated user profile
 * @access  Private (Bearer JWT)
 */
router.get('/me', authMiddleware, (req, res, next) => {
  return authController.getMe(req, res, next);
});

module.exports = router;
