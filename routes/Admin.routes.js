// backend/routes/Admin.routes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const Ingredient = require('../models/Ingredient');
const { protect, admin } = require('../middleware/Auth.middleware');

// All routes require admin access
router.use(protect, admin);

// Get all users with optional status filter
router.get('/users', async (req, res) => {
  try {
    const { status } = req.query;
    let query = { role: { $ne: 'admin' } };
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'activeToday') {
      // Get users active today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      
      query = {
        role: { $ne: 'admin' },
        $or: [
          { lastActive: { $gte: startOfToday, $lte: endOfToday } },
          { createdAt: { $gte: startOfToday, $lte: endOfToday } }
        ]
      };
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ lastActive: -1 });
    
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
    
    // Get users active today
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
      usersActiveToday,
      totalRecipesSaved: await Recipe.countDocuments({ savedByUsers: { $exists: true, $ne: [] } }),
      mostViewedRecipes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user with saved recipes
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('savedRecipes', 'title mealType image prepTime difficulty');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all recipes
router.get('/recipes', async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate('createdBy', 'username email')
      .sort({ views: -1 });
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
    const recipe = await Recipe.create(req.body);
    res.status(201).json(recipe);
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
