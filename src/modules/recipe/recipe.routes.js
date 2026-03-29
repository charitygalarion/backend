const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middlewares/auth.middleware');
const { uploadRecipeImage, uploadScanImage } = require('../../config/upload'); // ✅ Import uploadScanImage
const recipeController = require('./recipe.controller');
const multer = require('multer');
const upload = multer();
 
// Public routes 
router.get('/', recipeController.getRecipes);
router.get('/recent', recipeController.getRecentRecipes);
router.get('/popular', recipeController.getPopularRecipes); 
router.post('/find-by-ingredients', recipeController.findRecipesByIngredients);
 
// Protected routes - MUST be BEFORE /:id
router.get('/saved', protect, recipeController.getSavedRecipes);
router.put('/:id/servings', protect, recipeController.adjustServingSize);
 
// ✅ Use uploadScanImage for the scan endpoint
router.post('/scan', protect, uploadScanImage, recipeController.scanIngredients);
router.post('/generate-from-ingredients', protect, recipeController.generateFromIngredients);

// Public route with param - should be AFTER specific routes
router.get('/:id', recipeController.getRecipeById);

// Admin only routes with image upload
router.post('/', protect, admin, uploadRecipeImage, recipeController.createRecipe);
router.put('/:id', protect, admin, uploadRecipeImage, recipeController.updateRecipe);
router.delete('/:id', protect, admin, recipeController.deleteRecipe);


module.exports = router;