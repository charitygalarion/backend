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
    
    // Generate token with token version (user.tokenVersion is 0 by default)
    const tokenVersion = user.tokenVersion || 0;
    const token = generateToken(user.id, tokenVersion);
    setTokenCookie(res, token);
    
    const userData = transformResponse(user);
    
    res.status(201).json({
      success: true,
      user: userData,
      token // Also return token for mobile apps
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await authService.login(email, password);
    
    setTokenCookie(res, result.token);
    
    res.json({
      success: true,
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific error messages
    let statusCode = 401;
    let message = error.message;
    
    if (message.includes('banned')) {
      statusCode = 403;
    } else if (message.includes('suspended')) {
      statusCode = 403;
    }
    
    res.status(statusCode).json({ 
      success: false, 
      message: message 
    });
  }
};

exports.logout = async (req, res) => {
  try {
    // If user is logged in, invalidate their token by incrementing token version
    if (req.user && req.user.id) {
      await authService.logout(req.user.id);
    }
    
    // Clear the cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const result = await authService.forgotPassword(email);
    
    // Always return success message, don't reveal if email was sent
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset token has been sent to your email.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    await authService.resetPassword(token, password);
    
    res.json({ 
      success: true,
      message: 'Password reset successful. You can now log in with your new password.' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Optional: Get current user status
exports.getStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }
    
    const user = await authService.getUserStatus(req.user.id);
    
    res.json({
      success: true,
      status: user.status,
      isActive: user.isActive,
      suspensionUntil: user.suspendedUntil,
      banReason: user.banReason,
      message: user.status === 'active' ? 'Account active' : 
               user.status === 'suspended' ? `Suspended until ${new Date(user.suspendedUntil).toLocaleDateString()}` : 
               'Account banned'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,  
      message: error.message 
    });
  }
};