const { verifyToken } = require('../utils/token.util');
const db = require('../database/models');

const protect = async (req, res, next) => {
  let token;

  // Check for token in cookies first, then headers
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    // Find user in MySQL
    const user = await db.User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // Check if token version matches (invalidates old tokens after suspension/ban)
    if (user.tokenVersion !== undefined && decoded.tokenVersion !== undefined) {
      if (user.tokenVersion !== decoded.tokenVersion) {
        return res.status(401).json({ 
          message: 'Your session has expired. Please login again.',
          code: 'SESSION_EXPIRED'
        });
      }
    }

    // Check if user is banned
    if (user.status === 'banned') {
      return res.status(403).json({ 
        message: 'Your account has been permanently banned',
        code: 'ACCOUNT_BANNED'
      });
    }
    
    // Check if user is suspended
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

    // Check if account is active
    if (!user.isActive && user.status !== 'active') {
      return res.status(403).json({ 
        message: 'Your account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Attach user to request
    req.user = {
      _id: user.id,
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      isActive: user.isActive,
      status: user.status
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Not authorized' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as admin' });
  }
};

module.exports = { protect, admin };