const userService = require('./user.service');
const { transformResponse } = require('../../utils/response.util');

exports.getProfile = async (req, res) => {
  try {
    const user = await userService.getProfile(req.user._id);
    res.json(transformResponse(user));
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
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
    
    const user = await userService.updateProfile(req.user._id, {
      username,
      email,
      firstName,
      lastName,
      mealTypes: parsedMealTypes,
      dietaryRestrictions: parsedDietaryRestrictions
    }, imageFile);
    
    res.json(transformResponse(user));
  } catch (error) {
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
    res.status(400).json({ message: error.message });
  }
};

exports.getSavedRecipes = async (req, res) => {
  try {
    const recipes = await userService.getSavedRecipes(req.user._id);
    res.json(transformResponse(recipes));
  } catch (error) {
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
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};