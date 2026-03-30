const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { protect } = require('../../middlewares/auth.middleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);             // Regular login
router.post('/admin/login', authController.login);       // Admin login

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes (require authentication)
router.get('/status', protect, authController.getStatus);
router.post('/logout', protect, authController.logout);           // Regular logout
router.post('/admin/logout', protect, authController.logout);     // Admin logout

module.exports = router;