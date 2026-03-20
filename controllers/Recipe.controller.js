// backend/controllers/recipe.controller.js
const Recipe = require('../models/Recipe');
const User = require('../models/User');

exports.getRecipes = async (req, res) => {
  try {
    const { mealType, difficulty, search } = req.query;
    let query = {};

    if (mealType) query.mealType = mealType;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const recipes = await Recipe.find(query)
      .populate('createdBy', 'username')
      .limit(20);

    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('createdBy', 'username');
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.findRecipesByIngredients = async (req, res) => {
  try {
    const { ingredients, mealType } = req.body;
    
    // Find recipes that use the provided ingredients
    const recipes = await Recipe.find({
      'ingredients.name': { $in: ingredients },
      ...(mealType && { mealType })
    });

    // Sort by number of matching ingredients
    const recipesWithMatchCount = recipes.map(recipe => {
      const recipeIngredients = recipe.ingredients.map(i => i.name.toLowerCase());
      const matchCount = ingredients.filter(ing => 
        recipeIngredients.includes(ing.toLowerCase())
      ).length;
      
      return {
        ...recipe.toObject(),
        matchCount,
        matchPercentage: (matchCount / recipe.ingredients.length) * 100
      };
    });

    // Sort by best match first
    const sortedRecipes = recipesWithMatchCount.sort((a, b) => 
      b.matchPercentage - a.matchPercentage
    );

    res.json(sortedRecipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adjustServingSize = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const { servings } = req.body;
    const adjustedRecipe = recipe.adjustServings(servings);

    res.json(adjustedRecipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSavedRecipes = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('savedRecipes');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.savedRecipes || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};