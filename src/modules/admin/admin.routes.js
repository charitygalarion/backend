const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middlewares/auth.middleware');
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

// Recipe management
router.get('/recipes', adminController.getAllRecipes);
router.post('/recipes', adminController.createRecipe);
router.put('/recipes/:id', adminController.updateRecipe);
router.delete('/recipes/:id', adminController.deleteRecipe);

module.exports = router;