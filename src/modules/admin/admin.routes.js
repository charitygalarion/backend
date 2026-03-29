const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middlewares/auth.middleware');
const { uploadRecipeImage } = require('../../config/upload');
const adminController = require('./admin.controller');

// All admin routes require authentication and admin role
router.use(protect, admin);

// ============ DASHBOARD & STATS ============
router.get('/stats', adminController.getStats);
router.get('/dashboard', adminController.getDashboard);

// ============ USER MANAGEMENT ============
// GET routes - specific routes BEFORE parameter routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id/scans', adminController.getUserScannedImages); // ✅ Specific route first
router.get('/users/:id', adminController.getUserById);                 // ✅ Parameter route after

// PUT routes for user actions
router.put('/users/:id/warn', adminController.warnUser);
router.put('/users/:id/suspend', adminController.suspendUser);
router.put('/users/:id/ban', adminController.banUser);
router.put('/users/:id/restore', adminController.restoreUser);

// DELETE route
router.delete('/users/:id', adminController.deleteUser);

// ============ RECIPE MANAGEMENT ============
router.get('/recipes', adminController.getAllRecipes);
router.post('/recipes', uploadRecipeImage, adminController.createRecipe);
router.put('/recipes/:id', uploadRecipeImage, adminController.updateRecipe);
router.delete('/recipes/:id', adminController.deleteRecipe);

module.exports = router;