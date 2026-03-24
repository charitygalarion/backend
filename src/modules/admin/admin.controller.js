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
    const recipe = await recipeService.createRecipe(req.body, req.user._id);
    res.status(201).json(transformResponse(recipe));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await recipeService.updateRecipe(id, req.body);
    res.json(transformResponse(recipe));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    await recipeService.deleteRecipe(id);
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};