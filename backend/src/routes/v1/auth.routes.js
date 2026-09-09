const express = require('express');
const authController = require('../../controllers/auth.controller');
const validate = require('../../middlewares/validate.middleware');
const authenticate = require('../../middlewares/auth.middleware');
const { authRateLimiter } = require('../../middlewares/rateLimiter.middleware');
const { loginSchema, registerSchema, refreshTokenSchema } = require('../../validators/auth.validator');

const router = express.Router();

/**
 * @route POST /api/v1/auth/login
 * @desc User authentication & JWT issuance
 * @access Public
 */
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

/**
 * @route POST /api/v1/auth/register
 * @desc Public registration
 * @access Public
 */
router.post('/register', authRateLimiter, validate(registerSchema), authController.register);

/**
 * @route POST /api/v1/auth/refresh-token
 * @desc Exchange refresh token for new access and refresh tokens (Rotation)
 * @access Public
 */
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

/**
 * @route POST /api/v1/auth/logout
 * @desc Invalidate active refresh token
 * @access Public
 */
router.post('/logout', authController.logout);

/**
 * @route GET /api/v1/auth/me
 * @desc Get currently authenticated user profile
 * @access Private
 */
router.get('/me', authenticate, authController.getProfile);

module.exports = router;
