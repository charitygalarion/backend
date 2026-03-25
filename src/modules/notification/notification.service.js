const db = require('../../database/models');
const emailService = require('../../services/email.service');

class NotificationService {
  
  // Create notification with error handling
  async create(userId, type, title, message, severity = 'info', metadata = {}) {
    console.log('📧 [NOTIFICATION SERVICE] create called');
    console.log('   User ID:', userId);
    console.log('   Type:', type);
    console.log('   Title:', title);
    
    try {
      // Check if UserNotification model exists
      if (!db.UserNotification) {
        console.log('⚠️ UserNotification model not found, skipping notification creation');
        return null;
      }
      
      const notification = await db.UserNotification.create({
        userId,
        type,
        title,
        message,
        severity,
        metadata
      });
      
      console.log('✅ Notification created with ID:', notification.id);
      return notification;
    } catch (error) {
      console.error('❌ Failed to create notification:', error.message);
      console.error('   Stack:', error.stack);
      // Don't throw, just return null to avoid breaking the main flow
      return null;
    }
  }

  // Get user notifications
async getUserNotifications(userId, limit = 50) {
  console.log('📋 [NOTIFICATION SERVICE] getUserNotifications called');
  console.log('   User ID:', userId);
  
  try {
    if (!db.UserNotification) {
      console.log('⚠️ UserNotification model not found');
      return [];
    }
    
    const notifications = await db.UserNotification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],  // Use createdAt (model attribute name)
      limit
    });
    
    console.log(`✅ Found ${notifications.length} notifications`);
    return notifications;
  } catch (error) {
    console.error('❌ Failed to get user notifications:', error.message);
    return [];
  }
}

// Get unread notifications
async getUnreadNotifications(userId) {
  console.log('📋 [NOTIFICATION SERVICE] getUnreadNotifications called');
  console.log('   User ID:', userId);
  
  try {
    if (!db.UserNotification) {
      console.log('⚠️ UserNotification model not found');
      return [];
    }
    
    const notifications = await db.UserNotification.findAll({
      where: {
        userId,
        isRead: false,
        [db.Sequelize.Op.or]: [
          { expiresAt: null },
          { expiresAt: { [db.Sequelize.Op.gt]: new Date() } }
        ]
      },
      order: [['createdAt', 'DESC']]  // Use createdAt (model attribute name)
    });
    
    console.log(`✅ Found ${notifications.length} unread notifications`);
    return notifications;
  } catch (error) {
    console.error('❌ Failed to get unread notifications:', error.message);
    return [];
  }
}

  // Mark as read
  async markAsRead(notificationId, userId) {
    console.log('✅ [NOTIFICATION SERVICE] markAsRead called');
    console.log('   Notification ID:', notificationId);
    console.log('   User ID:', userId);
    
    try {
      if (!db.UserNotification) {
        console.log('⚠️ UserNotification model not found');
        return null;
      }
      
      const notification = await db.UserNotification.findOne({
        where: { id: notificationId, userId }
      });
      
      if (notification) {
        await notification.update({
          isRead: true,
          readAt: new Date()
        });
        console.log('✅ Notification marked as read');
      } else {
        console.log('⚠️ Notification not found');
      }
      
      return notification;
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error.message);
      return null;
    }
  }

  // Mark all as read
  async markAllAsRead(userId) {
    console.log('✅ [NOTIFICATION SERVICE] markAllAsRead called');
    console.log('   User ID:', userId);
    
    try {
      if (!db.UserNotification) {
        console.log('⚠️ UserNotification model not found');
        return;
      }
      
      const [updatedCount] = await db.UserNotification.update(
        { isRead: true, readAt: new Date() },
        { where: { userId, isRead: false } }
      );
      
      console.log(`✅ Marked ${updatedCount} notifications as read`);
    } catch (error) {
      console.error('❌ Failed to mark all as read:', error.message);
    }
  }

  // Delete notification
  async delete(notificationId, userId) {
    console.log('🗑️ [NOTIFICATION SERVICE] delete called');
    console.log('   Notification ID:', notificationId);
    console.log('   User ID:', userId);
    
    try {
      if (!db.UserNotification) {
        console.log('⚠️ UserNotification model not found');
        return 0;
      }
      
      const deleted = await db.UserNotification.destroy({
        where: { id: notificationId, userId }
      });
      
      console.log(`✅ Deleted ${deleted} notifications`);
      return deleted;
    } catch (error) {
      console.error('❌ Failed to delete notification:', error.message);
      return 0;
    }
  }

  // Send warning notification
  async sendWarning(user, reason, violationCount) {
    console.log('⚠️ [NOTIFICATION SERVICE] sendWarning called');
    console.log('   User:', user.username);
    console.log('   Reason:', reason);
    console.log('   Violation count:', violationCount);
    
    try {
      // Create in-app notification
      await this.create(
        user.id,
        'warning',
        '⚠️ Community Guidelines Warning',
        `You have received a warning for: ${reason}. Warning #${violationCount}. Further violations may result in suspension.`,
        'warning',
        { reason, violationCount }
      );
      
      // Send email (handle email service errors gracefully)
      try {
        await emailService.sendWarningEmail(user.email, user.username, reason, violationCount);
        console.log('   Warning email sent');
      } catch (emailError) {
        console.error('   Failed to send warning email:', emailError.message);
      }
      
      console.log('✅ Warning notification process completed');
    } catch (error) {
      console.error('❌ Failed to send warning notification:', error.message);
      // Don't throw, just log the error
    }
  }

  // Send suspension notification
  async sendSuspension(user, reason, durationDays, suspendedUntil) {
    console.log('⏰ [NOTIFICATION SERVICE] sendSuspension called');
    console.log('   User:', user.username);
    console.log('   Reason:', reason);
    console.log('   Duration:', durationDays, 'days');
    console.log('   Until:', suspendedUntil);
    
    try {
      await this.create(
        user.id,
        'suspension',
        '⏰ Account Temporarily Suspended',
        `Your account has been suspended for ${durationDays} days. Reason: ${reason}. Account will be restored on ${suspendedUntil.toLocaleDateString()}.`,
        'danger',
        { reason, durationDays, suspendedUntil }
      );
      
      try {
        await emailService.sendSuspensionEmail(user.email, user.username, reason, durationDays, suspendedUntil);
        console.log('   Suspension email sent');
      } catch (emailError) {
        console.error('   Failed to send suspension email:', emailError.message);
      }
      
      console.log('✅ Suspension notification process completed');
    } catch (error) {
      console.error('❌ Failed to send suspension notification:', error.message);
    }
  }

  // Send ban notification
  async sendBan(user, reason) {
    console.log('🚫 [NOTIFICATION SERVICE] sendBan called');
    console.log('   User:', user.username);
    console.log('   Reason:', reason);
    
    try {
      await this.create(
        user.id,
        'ban',
        '🚫 Account Permanently Banned',
        `Your account has been permanently banned. Reason: ${reason}. This decision is final.`,
        'danger',
        { reason }
      );
      
      try {
        await emailService.sendBanEmail(user.email, user.username, reason);
        console.log('   Ban email sent');
      } catch (emailError) {
        console.error('   Failed to send ban email:', emailError.message);
      }
      
      console.log('✅ Ban notification process completed');
    } catch (error) {
      console.error('❌ Failed to send ban notification:', error.message);
    }
  }

  // Send unban notification
  async sendUnban(user) {
    console.log('🔄 [NOTIFICATION SERVICE] sendUnban called');
    console.log('   User:', user.username);
    
    try {
      await this.create(
        user.id,
        'unban',
        '✅ Account Restored',
        'Your account has been restored. You can now access all features again.',
        'success'
      );
      
      try {
        await emailService.sendUnbanEmail(user.email, user.username);
        console.log('   Unban email sent');
      } catch (emailError) {
        console.error('   Failed to send unban email:', emailError.message);
      }
      
      console.log('✅ Unban notification process completed');
    } catch (error) {
      console.error('❌ Failed to send unban notification:', error.message);
    }
  }
}

module.exports = new NotificationService();