const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middlewares/auth.middleware');
const recipeController = require('./recipe.controller');

// Public routes
router.get('/', recipeController.getRecipes);
router.get('/:id', recipeController.getRecipeById);
router.post('/find-by-ingredients', recipeController.findRecipesByIngredients);

// Protected routes
router.get('/saved', protect, recipeController.getSavedRecipes);
router.put('/:id/servings', protect, recipeController.adjustServingSize);

// Admin only routes
router.post('/', protect, admin, recipeController.createRecipe);
router.put('/:id', protect, admin, recipeController.updateRecipe);
router.delete('/:id', protect, admin, recipeController.deleteRecipe);

module.exports = router;