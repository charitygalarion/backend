// backend/controllers/User.controller.js
const User = require('../models/User');
const Recipe = require('../models/Recipe');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      mealTypes: user.mealTypes,
      dietaryRestrictions: user.dietaryRestrictions,
      savedRecipes: user.savedRecipes || [],
      isActive: user.isActive,
      lastActive: user.lastActive
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, email, firstName, lastName, mealTypes, dietaryRestrictions } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username, email, firstName, lastName, mealTypes, dietaryRestrictions },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleSaveRecipe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { recipeId } = req.params;
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if recipe is already saved
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const savedRecipes = user.savedRecipes || [];
    const recipeIndex = savedRecipes.indexOf(recipeId);
    
    let isSaved;
    
    if (recipeIndex > -1) {
      // Recipe is already saved, remove it
      savedRecipes.splice(recipeIndex, 1);
      isSaved = false;
    } else {
      // Recipe is not saved, add it
      savedRecipes.push(recipeId);
      isSaved = true;
    }

    user.savedRecipes = savedRecipes;
    await user.save();

    res.json({ 
      savedRecipes, 
      isSaved 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSavedRecipes = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('savedRecipes');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.savedRecipes || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
