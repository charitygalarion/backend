const authService = require('./auth.service');
const { generateToken } = require('../../utils/token.util');
const { transformResponse } = require('../../utils/response.util');

exports.register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    const user = await authService.register({
      username,
      email,
      password,
      firstName,
      lastName
    });
    
    const token = generateToken(user.id);
    const userData = transformResponse(user);
    
    res.status(201).json({
      ...userData,
      token
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await authService.login(email, password);
    const token = generateToken(user.id);
    const userData = transformResponse(user);
    
    res.json({
      ...userData,
      token
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

exports.logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const result = await authService.forgotPassword(email);
    
    if (result) {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${result.resetToken}`;
      console.log(`Password reset link: ${resetUrl}`);
      
      // In production, send email here
      
      return res.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
        ...(process.env.NODE_ENV === 'development' && { resetUrl })
      });
    }
    
    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    await authService.resetPassword(token, password);
    
    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};