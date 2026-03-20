// backend/routes/Admin.routes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');
const { protect, admin } = require('../middleware/Auth.middleware');
const bcrypt = require('bcryptjs');

// All routes require admin access
router.use(protect, admin);

// Get all users with optional status filter
router.get('/users', async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }
    
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    
    // If no users exist, return example users
    if (users.length === 0) {
      const exampleUsers = [
        { _id: '1', username: 'john_doe', email: 'john@example.com', role: 'user', isActive: true, savedRecipes: ['1', '2'], createdAt: new Date(), lastActive: new Date() },
        { _id: '2', username: 'jane_smith', email: 'jane@example.com', role: 'user', isActive: true, savedRecipes: ['1'], createdAt: new Date(), lastActive: new Date() },
        { _id: '3', username: 'bob_wilson', email: 'bob@example.com', role: 'user', isActive: true, savedRecipes: [], createdAt: new Date(), lastActive: new Date() },
        { _id: '4', username: 'alice_brown', email: 'alice@example.com', role: 'user', isActive: false, savedRecipes: ['2', '3'], createdAt: new Date(), lastActive: new Date() },
        { _id: '5', username: 'charlie_davis', email: 'charlie@example.com', role: 'user', isActive: true, savedRecipes: ['1', '2', '3'], createdAt: new Date(), lastActive: new Date() },
        { _id: '6', username: 'diana_evans', email: 'diana@example.com', role: 'user', isActive: false, savedRecipes: [], createdAt: new Date(), lastActive: new Date() },
        { _id: '7', username: 'edward_garcia', email: 'edward@example.com', role: 'user', isActive: true, savedRecipes: ['2'], createdAt: new Date(), lastActive: new Date() },
        { _id: '8', username: 'frank_martinez', email: 'frank@example.com', role: 'user', isActive: true, savedRecipes: ['1'], createdAt: new Date(), lastActive: new Date() },
      ];
      
      let filteredUsers = exampleUsers;
      if (status === 'active') {
        filteredUsers = exampleUsers.filter(u => u.isActive);
      } else if (status === 'inactive') {
        filteredUsers = exampleUsers.filter(u => !u.isActive);
      }
      
      return res.json(filteredUsers);
    }
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRecipes = await Recipe.countDocuments();
    const totalIngredients = await Ingredient.countDocuments();
    
    // Get total recipes saved by all users
    const totalRecipesSaved = await User.aggregate([
      { $project: { savedRecipesCount: { $size: "$savedRecipes" } } },
      { $group: { _id: null, total: { $sum: "$savedRecipesCount" } } }
    ]);
    
    // Get users active today (lastActive or createdAt is today)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const usersActiveToday = await User.countDocuments({
      $or: [
        { lastActive: { $gte: startOfToday, $lte: endOfToday } },
        { createdAt: { $gte: startOfToday, $lte: endOfToday } }
      ]
    });
    
    // Get most viewed recipes (top 10)
    const mostViewedRecipes = await Recipe.find()
      .sort({ views: -1 })
      .limit(10)
      .select('title views mealType image');
    
    res.json({
      totalUsers,
      totalRecipes,
      totalIngredients,
      totalRecipesSaved: totalRecipesSaved[0]?.total || 0,
      usersActiveToday,
      mostViewedRecipes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user with saved recipes
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Populate saved recipes
    const populatedUser = await User.findById(req.params.id)
      .select('-password')
      .populate('savedRecipes', 'title mealType image prepTime difficulty');
    
    res.json(populatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all recipes
router.get('/recipes', async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .sort({ views: -1 })
      .populate('createdBy', 'username email');
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single recipe
router.get('/recipes/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('createdBy', 'username email');
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create recipe
router.post('/recipes', async (req, res) => {
  try {
    const recipe = new Recipe(req.body);
    const savedRecipe = await recipe.save();
    res.status(201).json(savedRecipe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update recipe
router.put('/recipes/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete recipe
router.delete('/recipes/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
