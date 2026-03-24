const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret123');
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };