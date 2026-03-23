const db = require('../../database/models');
const { comparePassword } = require('../../utils/password.util');
const crypto = require('crypto');

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
      isActive: true
    });
    
    return user;
  }
  
  async login(email, password) {
    // Find user
    const user = await db.User.findOne({ where: { email } });
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    
    // Update last active
    await user.update({ lastActive: new Date() });
    
    return user;
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
    
    await user.update({
      resetPasswordToken,
      resetPasswordExpires
    });
    
    return { user, resetToken };
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
}

module.exports = new AuthService();