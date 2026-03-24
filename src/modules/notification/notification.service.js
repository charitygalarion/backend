const db = require('../../database/models');
const emailService = require('../../services/email.service');

class NotificationService {
  // Create notification
  async create(userId, type, title, message, severity = 'info', metadata = {}) {
    return await db.UserNotification.create({
      userId,
      type,
      title,
      message,
      severity,
      metadata
    });
  }

  // Get user notifications
  async getUserNotifications(userId, limit = 50) {
    return await db.UserNotification.findAll({
      where: { userId },
      order: [['created_at', 'DESC']],  // ✅ Use created_at (database column)
      limit
    });
  }

  // Get unread notifications
  async getUnreadNotifications(userId) {
    return await db.UserNotification.findAll({
      where: {
        userId,
        isRead: false,
        [db.Sequelize.Op.or]: [
          { expiresAt: null },
          { expiresAt: { [db.Sequelize.Op.gt]: new Date() } }
        ]
      },
      order: [['created_at', 'DESC']]  // ✅ Use created_at (database column)
    });
  }

  // Mark as read
  async markAsRead(notificationId, userId) {
    const notification = await db.UserNotification.findOne({
      where: { id: notificationId, userId }
    });
    
    if (notification) {
      await notification.update({
        isRead: true,
        readAt: new Date()
      });
    }
    
    return notification;
  }

  // Mark all as read
  async markAllAsRead(userId) {
    await db.UserNotification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } }
    );
  }

  // Delete notification
  async delete(notificationId, userId) {
    return await db.UserNotification.destroy({
      where: { id: notificationId, userId }
    });
  }

  // Send warning notification
  async sendWarning(user, reason, violationCount) {
    await this.create(
      user.id,
      'warning',
      '⚠️ Community Guidelines Warning',
      `You have received a warning for: ${reason}. Warning #${violationCount}. Further violations may result in suspension.`,
      'warning',
      { reason, violationCount }
    );
    
    await emailService.sendWarningEmail(user.email, user.username, reason, violationCount);
  }

  // Send suspension notification
  async sendSuspension(user, reason, durationDays, suspendedUntil) {
    await this.create(
      user.id,
      'suspension',
      '⏰ Account Temporarily Suspended',
      `Your account has been suspended for ${durationDays} days. Reason: ${reason}. Account will be restored on ${suspendedUntil.toLocaleDateString()}.`,
      'danger',
      { reason, durationDays, suspendedUntil }
    );
    
    await emailService.sendSuspensionEmail(user.email, user.username, reason, durationDays, suspendedUntil);
  }

  // Send ban notification
  async sendBan(user, reason) {
    await this.create(
      user.id,
      'ban',
      '🚫 Account Permanently Banned',
      `Your account has been permanently banned. Reason: ${reason}. This decision is final.`,
      'danger',
      { reason }
    );
    
    await emailService.sendBanEmail(user.email, user.username, reason);
  }

  // Send unban notification
  async sendUnban(user) {
    await this.create(
      user.id,
      'unban',
      '✅ Account Restored',
      'Your account has been restored. You can now access all features again.',
      'success'
    );
    
    await emailService.sendUnbanEmail(user.email, user.username);
  }
}

module.exports = new NotificationService();