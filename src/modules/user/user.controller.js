const userService = require('./user.service');
const { transformResponse } = require('../../utils/response.util');
const db = require('../../database/models');
const path = require('path');
const fs = require('fs');

exports.getProfile = async (req, res) => {
  try {
    const user = await userService.getProfile(req.user.id);
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
    
    const user = await userService.updateProfile(req.user.id, updateData, imageFile);
    
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
    const result = await userService.toggleSaveRecipe(req.user.id, recipeId);
    
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
    const recipes = await userService.getSavedRecipes(req.user.id);
    res.json(transformResponse(recipes));
  } catch (error) {
    console.error('Get saved recipes error:', error);
    res.status(500).json({ message: error.message });
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
    const user = await db.User.findByPk(req.user.id);
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

// ============ NO ADMIN FUNCTIONS HERE ============
// The following functions have been REMOVED from user.controller:
// - getAllUsers
// - deleteUser  
// - getUserDetails
// - suspendUser
// - banUser
// - warnUser
// - restoreUser
// 
// These functions are now in admin.controller.js

module.exports = exports;