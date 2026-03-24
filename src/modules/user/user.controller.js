const userService = require('./user.service');
const { transformResponse } = require('../../utils/response.util');
const db = require('../../database/models');
const path = require('path');
const fs = require('fs');

exports.getProfile = async (req, res) => {
  try {
    const user = await userService.getProfile(req.user._id);
    res.json(transformResponse(user));
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(404).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    console.log('Update profile request body:', req.body);
    console.log('Update profile file:', req.file);
    
    const { username, email, firstName, lastName, mealTypes, dietaryRestrictions } = req.body;
    const imageFile = req.file;
    
    // Parse mealTypes and dietaryRestrictions if they're strings
    let parsedMealTypes = mealTypes;
    let parsedDietaryRestrictions = dietaryRestrictions;
    
    if (mealTypes && typeof mealTypes === 'string') {
      try {
        parsedMealTypes = JSON.parse(mealTypes);
      } catch (e) {
        parsedMealTypes = mealTypes.split(',').map(m => m.trim());
      }
    }
    
    if (dietaryRestrictions && typeof dietaryRestrictions === 'string') {
      try {
        parsedDietaryRestrictions = JSON.parse(dietaryRestrictions);
      } catch (e) {
        parsedDietaryRestrictions = dietaryRestrictions.split(',').map(d => d.trim());
      }
    }
    
    const updateData = {
      username,
      email,
      firstName,
      lastName,
      mealTypes: parsedMealTypes,
      dietaryRestrictions: parsedDietaryRestrictions
    };
    
    console.log('Update data:', updateData);
    
    const user = await userService.updateProfile(req.user._id, updateData, imageFile);
    
    res.json(transformResponse(user));
  } catch (error) {
    console.error('Update profile error:', error);
    console.error('Error stack:', error.stack);
    res.status(400).json({ message: error.message });
  }
};

exports.toggleSaveRecipe = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const result = await userService.toggleSaveRecipe(req.user._id, recipeId);
    
    res.json({
      message: result.isSaved ? 'Recipe saved' : 'Recipe removed',
      isSaved: result.isSaved
    });
  } catch (error) {
    console.error('Toggle save recipe error:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.getSavedRecipes = async (req, res) => {
  try {
    const recipes = await userService.getSavedRecipes(req.user._id);
    res.json(transformResponse(recipes));
  } catch (error) {
    console.error('Get saved recipes error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Admin only
exports.getAllUsers = async (req, res) => {
  try {
    const { status } = req.query;
    const users = await userService.getAllUsers({ status });
    res.json(transformResponse(users));
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(404).json({ message: error.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    console.log('Upload avatar request file:', req.file);
    
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    const avatarUrl = `/uploads/profiles/${req.file.filename}`;
    
    // Update user's avatar only
    const user = await db.User.findByPk(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete old avatar if exists
    if (user.avatar) {
      const oldAvatarPath = path.join(__dirname, '../../../uploads/profiles', path.basename(user.avatar));
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }
    
    await user.update({ avatar: avatarUrl });
    
    res.json({ url: avatarUrl, user: transformResponse(user) });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserDetails(id);
    res.json(transformResponse(user));
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};


exports.suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, durationDays } = req.body;
    
    const user = await userService.suspendUser(id, req.user._id, reason, durationDays || 7);
    res.json({ message: 'User suspended successfully', user: transformResponse(user) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const user = await userService.banUser(id, req.user._id, reason);
    res.json({ message: 'User banned successfully', user: transformResponse(user) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.warnUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await userService.warnUser(id, reason);
    res.json({ message: 'User warned successfully', violationCount: result.violationCount });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.restoreUser(id, req.user._id);
    res.json({ message: 'User restored successfully', user: transformResponse(user) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};