const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

// GET  /api/v1/users/roles/all  — must be before /:id to avoid param collision
router.get('/roles/all', (req, res, next) => userController.getRoles(req, res, next));

// GET    /api/v1/users           — paginated list with filters
router.get('/',     (req, res, next) => userController.list(req, res, next));

// GET    /api/v1/users/:id       — single user
router.get('/:id',  (req, res, next) => userController.getById(req, res, next));

// POST   /api/v1/users           — create user
router.post('/',    (req, res, next) => userController.create(req, res, next));

// PUT    /api/v1/users/:id       — update user
router.put('/:id',  (req, res, next) => userController.update(req, res, next));

// PATCH  /api/v1/users/:id/toggle-status
router.patch('/:id/toggle-status',  (req, res, next) => userController.toggleStatus(req, res, next));

// PATCH  /api/v1/users/:id/reset-password
router.patch('/:id/reset-password', (req, res, next) => userController.resetPassword(req, res, next));

// DELETE /api/v1/users/:id       — soft delete
router.delete('/:id', (req, res, next) => userController.remove(req, res, next));

module.exports = router;
