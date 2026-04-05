const db = require('../../database/models');
const { comparePassword } = require('../../utils/password.util');
const { generateToken } = require('../../utils/token.util');
const crypto = require('crypto');
const emailService = require('../../services/email.service');

class AuthService {
  async register(userData) {
    const { username, email, password, firstName, lastName } = userData;
    
    // Check if user exists
    const existingUser = await db.User.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ email }, { username }]
      }
    });
    
    if (existingUser) {
      throw new Error('User already exists with this email or username');
    }
    
    // Create user
    const user = await db.User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: 'user',
      isActive: true,
      status: 'active',
      tokenVersion: 0
    });
    
    return user;
  }
  
  async login(email, password) {
    const user = await db.User.findOne({ where: { email } });
    
    if (!user) {
      throw new Error('No account found with that email.'); // ← changed
    }

    if (user.status === 'banned') {
      throw new Error('Your account has been permanently banned. Please contact support.');
    }

    if (user.status === 'suspended') {
      const suspendedUntil = new Date(user.suspendedUntil);
      const now = new Date();
      
      if (suspendedUntil > now) {
        const daysLeft = Math.ceil((suspendedUntil - now) / (1000 * 60 * 60 * 24));
        throw new Error(`Your account is suspended. Please try again after ${suspendedUntil.toLocaleDateString()}. (${daysLeft} days remaining)`);
      } else {
        await user.update({
          status: 'active',
          suspensionReason: null,
          suspendedUntil: null,
          isActive: true
        });
        console.log(`✅ Auto-restored user: ${user.username} (suspension expired)`);
      }
    }
    
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Incorrect password. Please try again.'); // ← changed
    }
    
    await user.update({ lastActive: new Date() });
    
    const tokenVersion = user.tokenVersion || 0;
    const token = generateToken(user.id, tokenVersion);
    
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      status: user.status
    };
    
    return { user: userData, token };
  }
  
  async forgotPassword(email) {
    const user = await db.User.findOne({ where: { email } });
    
    if (!user) {
      // Don't reveal if user exists
      return null;
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    console.log('\n🔐 ========== PASSWORD RESET ==========');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Token: ${resetToken}`);
    console.log('=====================================\n');
    
    await user.update({
      resetPasswordToken,
      resetPasswordExpires
    });
    
    // Send email with token
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    const emailSent = await emailService.sendPasswordResetEmail(email, resetToken, resetUrl);
    
    return { user, resetToken, emailSent };
  }

  async resetPassword(token, newPassword) {
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await db.User.findOne({
      where: {
        resetPasswordToken,
        resetPasswordExpires: { [db.Sequelize.Op.gt]: new Date() }
      }
    });
    
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }
    
    // Update password
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    
    await user.save();
    
    return user;
  }
  
  async logout(userId) {
    const user = await db.User.findByPk(userId);
    if (user) {
      const currentTokenVersion = user.tokenVersion || 0;
      await user.update({ tokenVersion: currentTokenVersion + 1 });
      console.log(`✅ User ${user.username} logged out, token version incremented to ${currentTokenVersion + 1}`);
    }
    return true;
  }
  
  async getUserStatus(userId) {
    const user = await db.User.findByPk(userId, {
      attributes: ['id', 'username', 'status', 'isActive', 'suspendedUntil', 'banReason', 'tokenVersion']
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
}

module.exports = new AuthService();