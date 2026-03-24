const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middlewares/auth.middleware');
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

// Admin routes (require admin role)
router.use(admin);

router.route('/')
  .get(userController.getAllUsers);

router.get('/:id', userController.getUserDetails);
router.delete('/:id', userController.deleteUser);
router.put('/:id/suspend', userController.suspendUser);
router.put('/:id/ban', userController.banUser);
router.put('/:id/warn', userController.warnUser);
router.put('/:id/restore', userController.restoreUser);

module.exports = router;