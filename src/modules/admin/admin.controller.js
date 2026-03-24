const adminService = require('./admin.service');
const userService = require('../user/user.service');
const recipeService = require('../recipe/recipe.service');
const { transformResponse } = require('../../utils/response.util');

exports.getStats = async (req, res) => {
  try {
    const stats = await adminService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const dashboardData = await adminService.getDashboardData();
    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { status } = req.query;
    const users = await userService.getAllUsers({ status });
    res.json(transformResponse(users));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await adminService.getUserWithDetails(id);
    res.json(transformResponse(user));
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.deleteUser(id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllRecipes = async (req, res) => {
  try {
    const recipes = await recipeService.getAllRecipes({ limit: 100 });
    res.json(transformResponse(recipes));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createRecipe = async (req, res) => {
  try {
    console.log('=== ADMIN CREATE RECIPE ===');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('User:', req.user?._id);
    
    // Parse JSON strings from FormData
    let parsedBody = { ...req.body };
    
    if (req.body.ingredients && typeof req.body.ingredients === 'string') {
      try {
        parsedBody.ingredients = JSON.parse(req.body.ingredients);
      } catch (e) {
        console.error('Failed to parse ingredients:', e);
      }
    }
    
    if (req.body.instructions && typeof req.body.instructions === 'string') {
      try {
        parsedBody.instructions = JSON.parse(req.body.instructions);
      } catch (e) {
        console.error('Failed to parse instructions:', e);
      }
    }
    
    const recipe = await recipeService.createRecipe(parsedBody, req.user._id, req.file);
    res.status(201).json(transformResponse(recipe));
  } catch (error) {
    console.error('Create recipe error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Updating recipe ID:', id);
    console.log('Update body:', req.body);
    console.log('Update file:', req.file);
    
    if (!id) {
      return res.status(400).json({ message: 'Recipe ID is required' });
    }
    
    // Parse JSON strings from FormData
    let parsedBody = { ...req.body };
    
    // Parse ingredients
    if (req.body.ingredients && typeof req.body.ingredients === 'string') {
      try {
        parsedBody.ingredients = JSON.parse(req.body.ingredients);
        console.log('Parsed ingredients:', parsedBody.ingredients);
      } catch (e) {
        console.error('Failed to parse ingredients:', e);
        parsedBody.ingredients = [];
      }
    }
    
    // Parse instructions
    if (req.body.instructions && typeof req.body.instructions === 'string') {
      try {
        parsedBody.instructions = JSON.parse(req.body.instructions);
        console.log('Parsed instructions:', parsedBody.instructions);
      } catch (e) {
        console.error('Failed to parse instructions:', e);
        parsedBody.instructions = [];
      }
    }
    
    // Ensure numeric fields are numbers
    parsedBody.prepTime = parsedBody.prepTime ? parseInt(parsedBody.prepTime) : 0;
    parsedBody.cookTime = parsedBody.cookTime ? parseInt(parsedBody.cookTime) : 0;
    parsedBody.servings = parsedBody.servings ? parseInt(parsedBody.servings) : 4;
    
    const recipe = await recipeService.updateRecipe(parseInt(id), parsedBody, req.file);
    res.json(transformResponse(recipe));
  } catch (error) {
    console.error('Update recipe error:', error.message);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting recipe ID:', id);
    
    if (!id) {
      return res.status(400).json({ message: 'Recipe ID is required' });
    }
    
    await recipeService.deleteRecipe(parseInt(id));
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Delete recipe error:', error.message);
    res.status(404).json({ message: error.message });
  }
};