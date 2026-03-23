const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middlewares/auth.middleware');
const { uploadIngredientImage } = require('../../config/upload');
const ingredientController = require('./ingredient.controller');

// Public routes
router.get('/', ingredientController.getIngredients);
router.get('/by-category', ingredientController.getIngredientsByCategory);
router.get('/popular', ingredientController.getPopularIngredients);
router.get('/:id', ingredientController.getIngredientById);

// Admin only routes with image upload
router.post('/', protect, admin, uploadIngredientImage, ingredientController.createIngredient);
router.put('/:id', protect, admin, uploadIngredientImage, ingredientController.updateIngredient);
router.delete('/:id', protect, admin, ingredientController.deleteIngredient);

module.exports = router;