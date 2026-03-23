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
      .populate('createdBy', 'username email')
      .limit(20)
      .sort({ createdAt: -1 });

    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Increment views
    recipe.views += 1;
    await recipe.save();

    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateRecipe = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.findRecipesByIngredients = async (req, res) => {
  try {
    const { ingredients, mealType } = req.body;
    
    // Find all recipes
    let query = {};
    if (mealType) query.mealType = mealType;

    const recipes = await Recipe.find(query);

    // Filter recipes that contain any of the provided ingredients
    const recipesWithMatch = recipes.filter(recipe => {
      const recipeIngredients = recipe.ingredients || [];
      return ingredients.some(ing => 
        recipeIngredients.some(recipeIng => 
          recipeIng.name && recipeIng.name.toLowerCase().includes(ing.toLowerCase())
        )
      );
    });

    // Sort by number of matching ingredients
    const recipesWithMatchCount = recipesWithMatch.map(recipe => {
      const recipeIngredients = recipe.ingredients || [];
      const matchCount = ingredients.filter(ing => 
        recipeIngredients.some(recipeIng => 
          recipeIng.name && recipeIng.name.toLowerCase().includes(ing.toLowerCase())
        )
      ).length;
      
      return {
        ...recipe.toObject(),
        matchCount,
        matchPercentage: recipeIngredients.length > 0 
          ? (matchCount / recipeIngredients.length) * 100 
          : 0
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
    
    // Adjust ingredients
    const ratio = servings / recipe.servings;
    const adjustedIngredients = (recipe.ingredients || []).map(ing => ({
      ...ing,
      quantity: ing.quantity ? (parseFloat(ing.quantity) * ratio).toString() : ''
    }));

    res.json({
      ...recipe.toObject(),
      servings,
      ingredients: adjustedIngredients
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
