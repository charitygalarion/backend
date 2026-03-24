const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middlewares/auth.middleware');
const { uploadRecipeImage } = require('../../config/upload'); // ✅ Import this
const adminController = require('./admin.controller');

// All admin routes require authentication and admin role
router.use(protect, admin);

// Dashboard and stats
router.get('/stats', adminController.getStats);
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.delete('/users/:id', adminController.deleteUser);

// Recipe management with multer for image upload
router.get('/recipes', adminController.getAllRecipes);
router.post('/recipes', uploadRecipeImage, adminController.createRecipe);  // ✅ Add multer middleware
router.put('/recipes/:id', uploadRecipeImage, adminController.updateRecipe); // ✅ Add multer middleware
router.delete('/recipes/:id', adminController.deleteRecipe);

module.exports = router;