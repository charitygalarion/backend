// backend/routes/Recipe.routes.js
const express = require('express');
const router = express.Router();
const { 
  getRecipes, 
  getRecipeById, 
  findRecipesByIngredients,
  adjustServingSize,
  getSavedRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe
} = require('../controllers/Recipe.controller');
const { protect, admin } = require('../middleware/Auth.middleware');

router.get('/', getRecipes);
router.get('/saved', protect, getSavedRecipes);
router.get('/:id', getRecipeById);
router.post('/find-by-ingredients', findRecipesByIngredients);
router.put('/:id/servings', protect, adjustServingSize);

// Admin routes
router.post('/', protect, admin, createRecipe);
router.put('/:id', protect, admin, updateRecipe);
router.delete('/:id', protect, admin, deleteRecipe);

module.exports = router;
