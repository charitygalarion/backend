const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middlewares/auth.middleware');
const { uploadRecipeImage } = require('../../config/upload');
const recipeController = require('./recipe.controller');
const multer = require('multer');
const upload = multer();
// Public routes
router.get('/', recipeController.getRecipes);
router.post('/find-by-ingredients', recipeController.findRecipesByIngredients);

// Protected routes - MUST be BEFORE /:id
router.get('/saved', protect, recipeController.getSavedRecipes);  // ✅ Moved before /:id
router.put('/:id/servings', protect, recipeController.adjustServingSize);

router.post('/scan', protect, upload.single('image'), recipeController.scanIngredients);

// Public route with param - should be AFTER specific routes
router.get('/:id', recipeController.getRecipeById);

// Admin only routes with image upload
router.post('/', protect, admin, uploadRecipeImage, recipeController.createRecipe);
router.put('/:id', protect, admin, uploadRecipeImage, recipeController.updateRecipe);
router.delete('/:id', protect, admin, recipeController.deleteRecipe);



module.exports = router;