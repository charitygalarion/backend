const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const notificationController = require('./notification.controller');

// All routes require authentication
router.use(protect);

// Notification routes
router.get('/', notificationController.getNotifications);
router.get('/unread', notificationController.getUnreadNotifications);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;