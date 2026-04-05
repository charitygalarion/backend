// middlewares/checkUserStatus.js
const db = require('../database/models');

const checkUserStatus = async (req, res, next) => {
  if (!req.user) {
    return next();
  }
  
  try {
    const user = await db.User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Check if banned
    if (user.status === 'banned') {
      return res.status(403).json({ 
        message: 'Your account has been permanently banned',
        code: 'ACCOUNT_BANNED'
      });
    }
    
    // Check if suspended
    if (user.status === 'suspended') {
      const suspendedUntil = new Date(user.suspendedUntil);
      const now = new Date();
      
      if (suspendedUntil > now) {
        return res.status(403).json({ 
          message: `Your account is suspended until ${suspendedUntil.toLocaleDateString()}`,
          code: 'ACCOUNT_SUSPENDED',
          suspendedUntil: user.suspendedUntil
        });
      } else {
        // Auto-restore if suspension expired
        await user.update({
          status: 'active',
          suspensionReason: null,
          suspendedUntil: null,
          isActive: true
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Error checking user status:', error);
    next();
  }
};

module.exports = checkUserStatus;