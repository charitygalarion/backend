const adminService = require('./admin.service');
const recipeService = require('../recipe/recipe.service');
const { transformResponse } = require('../../utils/response.util');

// ============ DASHBOARD & STATS ============

exports.getStats = async (req, res) => {
  try {
    console.log('📊 [ADMIN] getStats called');
    console.log('   Timestamp:', new Date().toISOString());
    console.log('   User:', req.user?.username);
    
    const stats = await adminService.getStats();
    
    console.log('✅ [ADMIN] getStats completed');
    console.log('   Total users:', stats.totalUsers);
    console.log('   Total recipes:', stats.totalRecipes);
    
    res.json(stats);
  } catch (error) {
    console.error('❌ [ADMIN] getStats error:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    console.log('📊 [ADMIN] getDashboard called');
    console.log('   Timestamp:', new Date().toISOString());
    console.log('   User:', req.user?.username);
    
    const dashboardData = await adminService.getDashboardData();
    
    console.log('✅ [ADMIN] getDashboard completed');
    console.log('   Weekly stats:', dashboardData.weeklyStats?.length);
    console.log('   Top contributors:', dashboardData.topContributors?.length);
    
    res.json(dashboardData);
  } catch (error) {
    console.error('❌ [ADMIN] getDashboard error:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};

// ============ USER MANAGEMENT ============

exports.getAllUsers = async (req, res) => {
  try {
    console.log('👥 [ADMIN] getAllUsers called');
    console.log('   Timestamp:', new Date().toISOString());
    console.log('   Query params:', req.query);
    console.log('   Status filter:', req.query.status);
    
    const { status } = req.query;
    const users = await adminService.getAllUsers({ status });
    
    console.log('✅ [ADMIN] getAllUsers completed');
    console.log('   Total users found:', users.length);
    if (users.length > 0) {
      console.log('   First user:', users[0].username);
      console.log('   First user ID:', users[0].id);
    }
    
    res.json(transformResponse(users));
  } catch (error) {
    console.error('❌ [ADMIN] getAllUsers error:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    console.log('🔍 [ADMIN] getUserById called');
    console.log('   Timestamp:', new Date().toISOString());
    console.log('   User ID from params:', req.params.id);
    console.log('   Requesting admin:', req.user?.username);
    
    const { id } = req.params;
    const user = await adminService.getUserDetails(id);
    
    console.log('✅ [ADMIN] getUserById completed');
    console.log('   Username:', user?.username);
    console.log('   Email:', user?.email);
    console.log('   Status:', user?.status);
    console.log('   Role:', user?.role);
    
    res.json(transformResponse(user));
  } catch (error) {
    console.error('❌ [ADMIN] getUserById error:', error.message);
    console.error('   User ID:', req.params.id);
    console.error('   Stack:', error.stack);
    res.status(404).json({ message: error.message });
  }
};

exports.warnUser = async (req, res) => {
  try {
    console.log('⚠️ [ADMIN] warnUser called');
    console.log('   Timestamp:', new Date().toISOString());
    console.log('   User ID:', req.params.id);
    console.log('   Admin:', req.user?.username);
    console.log('   Reason:', req.body.reason);
    
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      console.log('❌ [ADMIN] warnUser failed: No reason provided');
      return res.status(400).json({ message: 'Warning reason is required' });
    }
    
    const result = await adminService.warnUser(id, reason);
    
    console.log('✅ [ADMIN] warnUser completed');
    console.log('   User warned:', result.user?.username);
    console.log('   New violation count:', result.violationCount);
    
    res.json({ 
      message: 'User warned successfully', 
      violationCount: result.violationCount 
    });
  } catch (error) {
    console.error('❌ [ADMIN] warnUser error:', error.message);
    console.error('   User ID:', req.params.id);
    console.error('   Reason:', req.body.reason);
    console.error('   Stack:', error.stack);
    res.status(400).json({ message: error.message });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    console.log('⏰ [ADMIN] suspendUser called');
    console.log('   Timestamp:', new Date().toISOString());
    console.log('   User ID:', req.params.id);
    console.log('   Admin:', req.user?.username);
    console.log('   Reason:', req.body.reason);
    console.log('   Duration days:', req.body.durationDays || 7);
    
    const { id } = req.params;
    const { reason, durationDays } = req.body;
    
    if (!reason || reason.trim() === '') {
      console.log('❌ [ADMIN] suspendUser failed: No reason provided');
      return res.status(400).json({ message: 'Suspension reason is required' });
    }
    
    const days = durationDays || 7;
    const user = await adminService.suspendUser(id, req.user.id, reason, days);
    
    console.log('✅ [ADMIN] suspendUser completed');
    console.log('   User suspended:', user.username);
    console.log('   Duration:', days, 'days');
    console.log('   Suspended until:', user.suspendedUntil);
    
    res.json({ 
      message: 'User suspended successfully', 
      user: transformResponse(user) 
    });
  } catch (error) {
    console.error('❌ [ADMIN] suspendUser error:', error.message);
    console.error('   User ID:', req.params.id);
    console.error('   Stack:', error.stack);
    res.status(400).json({ message: error.message });
  }
};

exports.banUser = async (req, res) => {
  try {
    console.log('🚫 [ADMIN] banUser called');
    console.log('   Timestamp:', new Date().toISOString());
    console.log('   User ID:', req.params.id);
    console.log('   Admin:', req.user?.username);
    console.log('   Reason:', req.body.reason);
    
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      console.log('❌ [ADMIN] banUser failed: No reason provided');
      return res.status(400).json({ message: 'Ban reason is required' });
    }
    
    const user = await adminService.banUser(id, req.user.id, reason);
    
    console.log('✅ [ADMIN] banUser completed');
    console.log('   User banned:', user.username);
    console.log('   Banned at:', user.bannedAt);
    
    res.json({ 
      message: 'User banned successfully', 
      user: transformResponse(user) 
    });
  } catch (error) {
    console.error('❌ [ADMIN] banUser error:', error.message);
    console.error('   User ID:', req.params.id);
    console.error('   Stack:', error.stack);
    res.status(400).json({ message: error.message });
  }
};

exports.restoreUser = async (req, res) => {
  try {
    console.log('🔄 [ADMIN] restoreUser called');
    console.log('   Timestamp:', new Date().toISOString());
    console.log('   User ID:', req.params.id);
    console.log('   Admin:', req.user?.username);
    
    const { id } = req.params;
    const user = await adminService.restoreUser(id, req.user.id);
    
    console.log('✅ [ADMIN] restoreUser completed');
    console.log('   User restored:', user.username);
    console.log('   Previous status:', user.moderationHistory?.slice(-1)[0]?.previousStatus);
    console.log('   New status:', user.status);
    
    res.json({ 
      message: 'User restored successfully', 
      user: transformResponse(user) 
    });
  } catch (error) {
    console.error('❌ [ADMIN] restoreUser error:', error.message);
    console.error('   User ID:', req.params.id);
    console.error('   Stack:', error.stack);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    console.log('🗑️ [ADMIN] deleteUser called');
    console.log('   Timestamp:', new Date().toISOString());
    console.log('   User ID:', req.params.id);
    console.log('   Admin:', req.user?.username);
    
    const { id } = req.params;
    await adminService.deleteUser(id);
    
    console.log('✅ [ADMIN] deleteUser completed');
    console.log('   User deleted successfully:', id);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('❌ [ADMIN] deleteUser error:', error.message);
    console.error('   User ID:', req.params.id);
    console.error('   Stack:', error.stack);
    res.status(400).json({ message: error.message });
  }
};

// ============ RECIPE MANAGEMENT ============

exports.getAllRecipes = async (req, res) => {
  try {
    console.log('📖 [ADMIN] getAllRecipes called');
    console.log('   Timestamp:', new Date().toISOString());
    
    // Pass adminView flag to prevent view counting
    const recipes = await recipeService.getAllRecipes({ 
      limit: 100,
      adminView: true  // ✅ Add this flag to indicate admin is viewing
    });
    
    console.log('✅ [ADMIN] getAllRecipes completed');
    console.log('   Total recipes:', recipes.length);
    
    res.json(transformResponse(recipes));
  } catch (error) {
    console.error('❌ [ADMIN] getAllRecipes error:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};



exports.createRecipe = async (req, res) => {
  try {
    console.log('📝 [ADMIN] createRecipe called');
    console.log('   Timestamp:', new Date().toISOString());
    console.log('   User:', req.user?.username);
    console.log('   Has file:', !!req.file);
    console.log('   Title:', req.body.title);
    console.log('   Meal type:', req.body.mealType);
    console.log('   Difficulty:', req.body.difficulty);
    
    let parsedBody = { ...req.body };
    
    if (req.body.ingredients && typeof req.body.ingredients === 'string') {
      try {
        parsedBody.ingredients = JSON.parse(req.body.ingredients);
        console.log('   Parsed ingredients count:', parsedBody.ingredients.length);
      } catch (e) {
        console.error('   Failed to parse ingredients:', e.message);
      }
    }
    
    if (req.body.instructions && typeof req.body.instructions === 'string') {
      try {
        parsedBody.instructions = JSON.parse(req.body.instructions);
        console.log('   Parsed instructions count:', parsedBody.instructions.length);
      } catch (e) {
        console.error('   Failed to parse instructions:', e.message);
      }
    }
    
    const recipe = await recipeService.createRecipe(parsedBody, req.user.id, req.file,req.user?.role);
    
    console.log('✅ [ADMIN] createRecipe completed');
    console.log('   Recipe ID:', recipe.id);
    console.log('   Title:', recipe.title);
    
    res.status(201).json(transformResponse(recipe));
  } catch (error) {
    console.error('❌ [ADMIN] createRecipe error:', error.message);
    console.error('   Stack:', error.stack);
    res.status(400).json({ message: error.message });
  }
};

exports.updateRecipe = async (req, res) => {
  try {
    console.log('✏️ [ADMIN] updateRecipe called');
    console.log('   Timestamp:', new Date().toISOString());
    console.log('   Recipe ID:', req.params.id);
    console.log('   User:', req.user?.username);
    console.log('   Has file:', !!req.file);
    console.log('   Title:', req.body.title);
    console.log('   Meal type:', req.body.mealType);
    
    const { id } = req.params;
    let parsedBody = { ...req.body };
    
    if (req.body.ingredients && typeof req.body.ingredients === 'string') {
      try {
        parsedBody.ingredients = JSON.parse(req.body.ingredients);
        console.log('   Parsed ingredients count:', parsedBody.ingredients.length);
      } catch (e) {
        console.error('   Failed to parse ingredients:', e.message);
        parsedBody.ingredients = [];
      }
    }
    
    if (req.body.instructions && typeof req.body.instructions === 'string') {
      try {
        parsedBody.instructions = JSON.parse(req.body.instructions);
        console.log('   Parsed instructions count:', parsedBody.instructions.length);
      } catch (e) {
        console.error('   Failed to parse instructions:', e.message);
        parsedBody.instructions = [];
      }
    }
    
    parsedBody.prepTime = parsedBody.prepTime ? parseInt(parsedBody.prepTime) : 0;
    parsedBody.cookTime = parsedBody.cookTime ? parseInt(parsedBody.cookTime) : 0;
    parsedBody.servings = parsedBody.servings ? parseInt(parsedBody.servings) : 4;
    
    console.log('   Prep time:', parsedBody.prepTime);
    console.log('   Cook time:', parsedBody.cookTime);
    console.log('   Servings:', parsedBody.servings);
    
    // Pass user ID and role to prevent view counting
    const recipe = await recipeService.updateRecipe(
      parseInt(id), 
      parsedBody, 
      req.file,
      req.user?.id,
      req.user?.role  // Pass the role
    );
    
    console.log('✅ [ADMIN] updateRecipe completed');
    console.log('   Recipe ID:', recipe.id);
    console.log('   Title:', recipe.title);
    
    res.json(transformResponse(recipe));
  } catch (error) {
    console.error('❌ [ADMIN] updateRecipe error:', error.message);
    console.error('   Recipe ID:', req.params.id);
    console.error('   Stack:', error.stack);
    res.status(400).json({ message: error.message });
  }
};


exports.deleteRecipe = async (req, res) => {
  try {
    console.log('🗑️ [ADMIN] deleteRecipe called');
    console.log('   Timestamp:', new Date().toISOString());
    console.log('   Recipe ID:', req.params.id);
    console.log('   User:', req.user?.username);
    
    const { id } = req.params;
    await recipeService.deleteRecipe(parseInt(id));
    
    console.log('✅ [ADMIN] deleteRecipe completed');
    console.log('   Recipe deleted:', id);
    
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('❌ [ADMIN] deleteRecipe error:', error.message);
    console.error('   Recipe ID:', req.params.id);
    console.error('   Stack:', error.stack);
    res.status(404).json({ message: error.message });
  }
};