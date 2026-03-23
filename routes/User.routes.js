// backend/routes/User.routes.js
const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getAllUsers, deleteUser, toggleSaveRecipe, getSavedRecipes } = require('../controllers/User.controller');
const { protect, admin } = require('../middleware/Auth.middleware');

// All routes require authentication
router.use(protect);

// User profile routes
router.route('/profile')
  .get(getProfile)
  .put(updateProfile);

// Saved recipes routes
router.route('/saved')
  .get(getSavedRecipes);

router.route('/saved/:recipeId')
  .post(toggleSaveRecipe);

// Admin routes
router.use(admin);

router.route('/')
  .get(getAllUsers);

router.route('/:id')
  .delete(deleteUser);

module.exports = router;
