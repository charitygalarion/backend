const recipeService = require('./recipe.service');
const { transformResponse } = require('../../utils/response.util');
const multer = require('multer');
const upload = multer();

exports.getRecipes = async (req, res) => {
  try {
    const { mealType, difficulty, search, limit } = req.query;
    const recipes = await recipeService.getAllRecipes({
      mealType,
      difficulty,
      search,
      limit
    });
    res.json(transformResponse(recipes));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 

exports.getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await recipeService.getRecipeById(id);
    res.json(transformResponse(recipe));
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.createRecipe = async (req, res) => {
  try {
    const recipe = await recipeService.createRecipe(req.body, req.user._id, req.file);
    res.status(201).json(transformResponse(recipe));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await recipeService.updateRecipe(id, req.body, req.file);
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

exports.findRecipesByIngredients = async (req, res) => {
  try {
    const { ingredients, mealType } = req.body;
    
    if (!ingredients || !ingredients.length) {
      return res.status(400).json({ message: 'Please provide ingredients' });
    }
    
    const recipes = await recipeService.findRecipesByIngredients(ingredients, mealType);
    res.json(transformResponse(recipes));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adjustServingSize = async (req, res) => {
  try {
    const { id } = req.params;
    const { servings } = req.body;
    
    if (!servings || servings < 1) {
      return res.status(400).json({ message: 'Please provide valid servings' });
    }
    
    const adjustedRecipe = await recipeService.adjustServings(id, servings);
    res.json(transformResponse(adjustedRecipe));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSavedRecipes = async (req, res) => {
  try {
    const recipes = await recipeService.getSavedRecipes(req.user._id);
    // Always return array, even if empty
    res.json(transformResponse(recipes || []));
  } catch (error) {
    console.error('Error in getSavedRecipes controller:', error);
    // Return empty array instead of error
    res.json([]);
  }
}; 


exports.scanIngredients = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    const result = await recipeService.scanIngredientsFromImage(req.file.buffer);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add these functions after getRecipes

exports.getRecentRecipes = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const recipes = await recipeService.getRecentRecipes(parseInt(limit));
    res.json(transformResponse(recipes));
  } catch (error) {
    console.error('Error fetching recent recipes:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getPopularRecipes = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const recipes = await recipeService.getPopularRecipes(parseInt(limit));
    res.json(transformResponse(recipes));
  } catch (error) {
    console.error('Error fetching popular recipes:', error);
    res.status(500).json({ message: error.message });
  }
};