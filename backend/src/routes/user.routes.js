const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

/**
 * @route   GET /api/v1/users
 * @desc    Get active CRM users / sales reps
 * @access  Private (ADMIN, SALES)
 */
router.get('/', (req, res, next) => {
  return userController.list(req, res, next);
});

module.exports = router;
