const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { protect } = require('../../middlewares/auth.middleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes (require authentication)
router.get('/status', protect, authController.getStatus);  // ✅ Add this line
router.post('/logout', protect, authController.logout);     // ✅ Add this line (optional)

module.exports = router;  