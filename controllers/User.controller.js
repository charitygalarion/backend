// backend/controllers/User.controller.js
const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username) user.username = username;
    if (email) user.email = email;

    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role
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
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleSaveRecipe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { recipeId } = req.params;
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const savedIndex = user.savedRecipes.indexOf(recipeId);
    let isSaved;
    
    if (savedIndex > -1) {
      // Recipe is already saved, remove it
      user.savedRecipes.splice(savedIndex, 1);
      isSaved = false;
    } else {
      // Recipe is not saved, add it
      user.savedRecipes.push(recipeId);
      isSaved = true;
    }

    await user.save();
    res.json({ savedRecipes: user.savedRecipes, isSaved });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
