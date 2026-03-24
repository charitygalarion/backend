const notificationService = require('./notification.service');
const { transformResponse } = require('../../utils/response.util');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user._id);
    res.json(transformResponse(notifications));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUnreadNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.getUnreadNotifications(req.user._id);
    res.json(transformResponse(notifications));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(id, req.user._id);
    res.json(transformResponse(notification));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await notificationService.delete(id, req.user._id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};