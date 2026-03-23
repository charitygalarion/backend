const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middlewares/auth.middleware');
const ingredientController = require('./ingredient.controller');

// Public routes
router.get('/', ingredientController.getIngredients);
router.get('/by-category', ingredientController.getIngredientsByCategory);
router.get('/popular', ingredientController.getPopularIngredients);
router.get('/:id', ingredientController.getIngredientById);

// Admin only routes
router.post('/', protect, admin, ingredientController.createIngredient);
router.put('/:id', protect, admin, ingredientController.updateIngredient);
router.delete('/:id', protect, admin, ingredientController.deleteIngredient);

module.exports = router;