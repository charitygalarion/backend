const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const { uploadProfileImage } = require('../../config/upload');
const userController = require('./user.controller');

// All user routes require authentication
router.use(protect);

// User profile routes
router.route('/profile')
  .get(userController.getProfile)
  .put(uploadProfileImage, userController.updateProfile);

// Avatar upload
router.post('/upload/avatar', uploadProfileImage, userController.uploadAvatar);

// Saved recipes routes
router.route('/saved')
  .get(userController.getSavedRecipes);

router.route('/saved/:recipeId')
  .post(userController.toggleSaveRecipe);
;

// Add these routes
router.post('/save-generated-recipe', protect, userController.saveGeneratedRecipe);
router.get('/generated-recipes', protect, userController.getUserGeneratedRecipes);
router.delete('/generated-recipes/:id', protect, userController.deleteUserGeneratedRecipe);

// NO ADMIN ROUTES HERE - They are moved to admin module

module.exports = router;