const authService = require('./auth.service');
const { generateToken } = require('../../utils/token.util');
const { transformResponse } = require('../../utils/response.util');

// Helper to set cookie
const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction, // HTTPS only in production
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/'
  });
};

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
    setTokenCookie(res, token);
    
    const userData = transformResponse(user);
    
    res.status(201).json({
      ...userData,
      token // Also return token for mobile apps
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
    setTokenCookie(res, token);
    
    const userData = transformResponse(user);
    
    res.json({
      ...userData,
      token // Also return token for mobile apps
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

exports.logout = async (req, res) => {
  // Clear the cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  
  res.json({ message: 'Logged out successfully' });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const result = await authService.forgotPassword(email);
    
    if (result) {
      // Always return success message, don't reveal if email was sent
      return res.json({
        message: 'If an account exists with this email, a password reset token has been sent to your email.'
      });
    }
    
    res.json({
      message: 'If an account exists with this email, a password reset token has been sent to your email.'
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