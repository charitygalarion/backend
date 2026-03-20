// backend/routes/Recipe.routes.js
const express = require('express');
const router = express.Router();
const { 
  getRecipes, 
  getRecipeById, 
  findRecipesByIngredients,
  adjustServingSize,
  getSavedRecipes
} = require('../controllers/Recipe.controller');
const { protect } = require('../middleware/Auth.middleware');

router.get('/', getRecipes);
router.get('/saved', protect, getSavedRecipes);
router.get('/:id', getRecipeById);
router.post('/find-by-ingredients', findRecipesByIngredients);
router.put('/:id/servings', protect, adjustServingSize);

module.exports = router;
