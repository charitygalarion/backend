const db = require('../../database/models');
const { Op } = require('sequelize');
const notificationService = require('../notification/notification.service');


function parseScannedImages(scannedImages, context = '') {
  console.log(`🔧 [parseScannedImages] ${context} - START`);
  console.log(`   Input type: ${typeof scannedImages}`);
  console.log(`   Input is null: ${scannedImages === null}`);
  console.log(`   Input is undefined: ${scannedImages === undefined}`);
  
  if (typeof scannedImages === 'string') {
    console.log(`   Input string length: ${scannedImages.length}`);
    console.log(`   Input preview: ${scannedImages.substring(0, 200)}`);
  } else {
    console.log(`   Input value:`, scannedImages);
  }
  
  if (!scannedImages) {
    console.log(`   ${context} -> No scannedImages, returning []`);
    return [];
  }
  
  let result = scannedImages;
  let parseCount = 0;
  const maxParses = 5;
  
  while (typeof result === 'string' && parseCount < maxParses) {
    try {
      result = JSON.parse(result);
      parseCount++;
      console.log(`   ${context} -> Parse ${parseCount} successful`);
      console.log(`       Result type: ${typeof result}`);
      console.log(`       Is array: ${Array.isArray(result)}`);
      if (Array.isArray(result)) {
        console.log(`       Array length: ${result.length}`);
      }
    } catch (e) {
      console.log(`   ${context} -> Parse ${parseCount} failed: ${e.message}`);
      break;
    }
  }
  
  const isValid = Array.isArray(result);
  console.log(`   ${context} -> Final result: isArray=${isValid}, length=${isValid ? result.length : 0}`);
  
  if (isValid && result.length > 0) {
    console.log(`   ${context} -> First item preview:`, JSON.stringify(result[0]).substring(0, 200));
  }
  
  console.log(`🔧 [parseScannedImages] ${context} - END`);
  return isValid ? result : [];
}

class AdminService {
  
  // ============ USER MANAGEMENT FUNCTIONS ============

  async getUserDetails(userId) {
    console.log('🔍 [ADMIN SERVICE] getUserDetails called');
    console.log('   User ID:', userId);
    console.log('   Type:', typeof userId);
    
    try {
      const user = await db.User.findByPk(userId, {
        attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
      });
      
      if (!user) {
        console.log('❌ [ADMIN SERVICE] User not found:', userId);
        throw new Error('User not found');
      }
      
      console.log('✅ [ADMIN SERVICE] User found:', user.username);
      console.log('   User ID:', user.id);
      console.log('   User role:', user.role);
      console.log('   User status:', user.status);
      console.log('   Raw scannedImages field type:', typeof user.scannedImages);
      console.log('   Raw scannedImages value preview:', 
        typeof user.scannedImages === 'string' ? user.scannedImages.substring(0, 200) : user.scannedImages);
      
      // Get saved recipes count
      const savedRecipesCount = await db.UserSavedRecipe.count({
        where: { user_id: userId }
      });
      console.log('   Saved recipes count:', savedRecipesCount);
      
      // Get recipes created by user
      const recipes = await db.Recipe.findAll({
        where: { created_by: userId },
        attributes: ['id', 'title', 'image', 'created_at'],
        order: [['created_at', 'DESC']]
      });
      console.log('   User recipes count:', recipes.length);
      
      // Parse reportedImages
      let reportedImages = [];
      if (user.reportedImages) {
        console.log('   Raw reportedImages type:', typeof user.reportedImages);
        if (Array.isArray(user.reportedImages)) {
          reportedImages = user.reportedImages;
        } else if (typeof user.reportedImages === 'string') {
          try {
            reportedImages = JSON.parse(user.reportedImages);
            console.log('   Reported images parsed from string, count:', reportedImages.length);
          } catch (e) {
            console.error('   Failed to parse reportedImages:', e.message);
            reportedImages = [];
          }
        }
      }
      console.log('   Reported images count:', reportedImages.length);
      
      // ✅ Parse scannedImages using helper function
      const scannedImages = parseScannedImages(user.scannedImages, 'getUserDetails');
      console.log('   📸 Scanned images count:', scannedImages.length);
      
      // Log first few scanned images
      if (scannedImages.length > 0) {
        scannedImages.slice(0, 3).forEach((scan, idx) => {
          console.log(`     Scan ${idx + 1}:`, scan.url || 'No URL');
          console.log(`       Ingredients:`, scan.ingredients?.length || 0);
        });
      }
      
      const result = {
        ...user.toJSON(),
        savedRecipesCount,
        recipes,
        reportedImages,
        scannedImages
      };
      
      console.log('✅ [ADMIN SERVICE] getUserDetails completed successfully');
      console.log('result:',result);
      return result;
    } catch (error) {
      console.error('❌ [ADMIN SERVICE] getUserDetails error:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  }

  async getAllUsers(filters = {}) {
    console.log('👥 [ADMIN SERVICE] getAllUsers called');
    console.log('   Filters:', filters);
    
    try {
      const { status } = filters;
      const where = {};
      
      if (status === 'active') {
        where.isActive = true;
        where.status = 'active';
        console.log('   Filter: Active users');
      } else if (status === 'suspended') {
        where.status = 'suspended';
        console.log('   Filter: Suspended users');
      } else if (status === 'banned') {
        where.status = 'banned';
        console.log('   Filter: Banned users');
      } else if (status === 'activeToday') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        
        where.last_active = {
          [Op.between]: [startOfToday, endOfToday]
        };
        console.log('   Filter: Active today');
      } else {
        console.log('   Filter: All users');
      }
      
      const users = await db.User.findAll({
        where,
        attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
        order: [['last_active', 'DESC']]
      });
      
      console.log(`   Found ${users.length} users in database`);
      
      const usersWithCount = await Promise.all(users.map(async (user) => {
        const savedCount = await db.UserSavedRecipe.count({
          where: { user_id: user.id }
        });
        
        console.log(`   📊 Processing user: ${user.username} (ID: ${user.id})`);
        console.log(`      Raw scannedImages type: ${typeof user.scannedImages}`);
        
        // ✅ Parse scannedImages using helper function
        const parsedScannedImages = parseScannedImages(user.scannedImages, `getAllUsers-${user.username}`);
        const scannedImagesCount = parsedScannedImages.length;
        
        console.log(`      ✅ ${user.username}: scannedImagesCount = ${scannedImagesCount}, savedCount = ${savedCount}`);
        
        return {
          ...user.toJSON(),
          savedRecipesCount: savedCount,
          scannedImagesCount,
        };
      }));
      
      console.log(`✅ [ADMIN SERVICE] getAllUsers completed, returning ${usersWithCount.length} users`);
      if (usersWithCount.length > 0) {
        console.log(`   First user: ${usersWithCount[0].username} (ID: ${usersWithCount[0].id})`);
        console.log(`   Scanned images count: ${usersWithCount[0].scannedImagesCount}`);
      }
      
      return usersWithCount;
    } catch (error) {
      console.error('❌ [ADMIN SERVICE] getAllUsers error:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  }


  // ============ DASHBOARD & STATS ============
  
  async getStats() {
    console.log('📊 [ADMIN SERVICE] getStats called');
    
    try {
      const totalUsers = await db.User.count();
      console.log('   Total users:', totalUsers);
      
      const totalRecipes = await db.Recipe.count();
      console.log('   Total recipes:', totalRecipes);
      
      const totalIngredients = await db.Ingredient.count();
      console.log('   Total ingredients:', totalIngredients);
      
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      
      const usersActiveToday = await db.User.count({
        where: {
          last_active: {
            [Op.between]: [startOfToday, endOfToday]
          }
        }
      });
      console.log('   Users active today:', usersActiveToday);
      
      const totalRecipesSaved = await db.UserSavedRecipe.count({
        distinct: true, 
        col: 'recipe_id'
      });
      console.log('   Total recipes saved:', totalRecipesSaved);
      
      const mostViewedRecipes = await db.Recipe.findAll({
        attributes: ['id', 'title', 'views', 'meal_type', 'image'],
        order: [['views', 'DESC']],
        limit: 10
      });
      console.log('   Most viewed recipes count:', mostViewedRecipes.length);
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const newUsersLast7Days = await db.User.count({
        where: {
          created_at: { [Op.gte]: sevenDaysAgo }
        }
      });
      console.log('   New users last 7 days:', newUsersLast7Days);
      
      const newRecipesLast7Days = await db.Recipe.count({
        where: {
          created_at: { [Op.gte]: sevenDaysAgo }
        }
      });
      console.log('   New recipes last 7 days:', newRecipesLast7Days);
      
      const result = {
        totalUsers,
        totalRecipes,
        totalIngredients,
        usersActiveToday,
        totalRecipesSaved,
        newUsersLast7Days,
        newRecipesLast7Days,
        mostViewedRecipes: mostViewedRecipes.map(r => ({
          _id: r.id,
          title: r.title,
          views: r.views,
          mealType: r.meal_type,
          image: r.image
        }))
      };
      
      console.log('✅ [ADMIN SERVICE] getStats completed');
      return result;
    } catch (error) {
      console.error('❌ [ADMIN SERVICE] getStats error:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  }

  async getDashboardData() {
    console.log('📈 [ADMIN SERVICE] getDashboardData called');
    
    try {
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const newUsers = await db.User.count({
          where: {
            created_at: { [Op.between]: [date, nextDate] }
          }
        });
        
        const newRecipes = await db.Recipe.count({
          where: {
            created_at: { [Op.between]: [date, nextDate] }
          }
        });
        
        weeklyData.push({
          date: date.toISOString().split('T')[0],
          newUsers,
          newRecipes
        });
      }
      console.log('   Weekly data generated:', weeklyData.length, 'weeks');
      
      const topContributors = await db.Recipe.findAll({
        attributes: [
          'created_by',
          [db.Sequelize.fn('COUNT', db.Sequelize.col('created_by')), 'recipeCount']
        ],
        group: ['created_by'],
        order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('created_by')), 'DESC']],
        limit: 5,
        include: [{
          model: db.User,
          as: 'creator',
          attributes: ['username', 'email', 'avatar']
        }]
      });
      console.log('   Top contributors count:', topContributors.length);
      
      const result = {
        weeklyStats: weeklyData,
        topContributors: topContributors.map(tc => ({
          user: tc.creator,
          recipeCount: tc.dataValues.recipeCount
        }))
      };
      
      console.log('✅ [ADMIN SERVICE] getDashboardData completed');
      return result;
    } catch (error) {
      console.error('❌ [ADMIN SERVICE] getDashboardData error:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  }

  async deleteUser(userId) {
    console.log('🗑️ [ADMIN SERVICE] deleteUser called');
    console.log('   User ID:', userId);
    
    try {
      const user = await db.User.findByPk(userId);
      
      if (!user) {
        console.log('❌ [ADMIN SERVICE] User not found:', userId);
        throw new Error('User not found');
      }
      
      console.log('   User found:', user.username);
      console.log('   User role:', user.role);
      
      if (user.role === 'admin') {
        console.log('❌ [ADMIN SERVICE] Cannot delete admin user');
        throw new Error('Cannot delete admin user');
      }
      
      await user.destroy();
      console.log('✅ [ADMIN SERVICE] User deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ [ADMIN SERVICE] deleteUser error:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  }

  async suspendUser(userId, adminId, reason, durationDays = 7) {
    console.log('⏰ [ADMIN SERVICE] suspendUser called');
    console.log('   User ID:', userId);
    console.log('   Admin ID:', adminId);
    console.log('   Duration days:', durationDays);
    console.log('   Reason:', reason);
    
    try {
      const user = await db.User.findByPk(userId);
      
      if (!user) {
        console.log('❌ [ADMIN SERVICE] User not found:', userId);
        throw new Error('User not found');
      }
      
      console.log('   User found:', user.username);
      console.log('   User role:', user.role);
      
      if (user.role === 'admin') {
        console.log('❌ [ADMIN SERVICE] Cannot suspend admin user');
        throw new Error('Cannot suspend admin users');
      }
      
      const suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + durationDays);
      console.log('   Suspended until:', suspendedUntil);
      
      let history = [];
      if (user.moderationHistory) {
        if (Array.isArray(user.moderationHistory)) {
          history = user.moderationHistory;
        } else if (typeof user.moderationHistory === 'string') {
          try {
            history = JSON.parse(user.moderationHistory);
          } catch (e) {
            history = [];
          }
        }
      }
      
      history.push({
        action: 'suspended',
        reason,
        adminId,
        date: new Date(),
        duration: `${durationDays} days`,
        suspendedUntil
      });
      
      await user.update({
        status: 'suspended',
        suspensionReason: reason,
        suspendedUntil,
        moderationHistory: history,
        isActive: false
      });
      
      console.log('✅ [ADMIN SERVICE] User suspended successfully');
      
      await notificationService.sendSuspension(user, reason, durationDays, suspendedUntil);
      console.log('   Notification sent');
      
      return user;
    } catch (error) {
      console.error('❌ [ADMIN SERVICE] suspendUser error:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  }

  async banUser(userId, adminId, reason) {
    console.log('🚫 [ADMIN SERVICE] banUser called');
    console.log('   User ID:', userId);
    console.log('   Admin ID:', adminId);
    console.log('   Reason:', reason);
    
    try {
      const user = await db.User.findByPk(userId);
      
      if (!user) {
        console.log('❌ [ADMIN SERVICE] User not found:', userId);
        throw new Error('User not found');
      }
      
      console.log('   User found:', user.username);
      console.log('   User role:', user.role);
      
      if (user.role === 'admin') {
        console.log('❌ [ADMIN SERVICE] Cannot ban admin user');
        throw new Error('Cannot ban admin users');
      }
      
      let history = [];
      if (user.moderationHistory) {
        if (Array.isArray(user.moderationHistory)) {
          history = user.moderationHistory;
        } else if (typeof user.moderationHistory === 'string') {
          try {
            history = JSON.parse(user.moderationHistory);
          } catch (e) {
            history = [];
          }
        }
      }
      
      history.push({
        action: 'banned',
        reason,
        adminId,
        date: new Date(),
        permanent: true
      });
      
      await user.update({
        status: 'banned',
        banReason: reason,
        bannedAt: new Date(),
        bannedBy: adminId,
        moderationHistory: history,
        isActive: false
      });
      
      console.log('✅ [ADMIN SERVICE] User banned successfully');
      
      await notificationService.sendBan(user, reason);
      console.log('   Notification sent');
      
      return user;
    } catch (error) {
      console.error('❌ [ADMIN SERVICE] banUser error:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  }
 
  async warnUser(userId, reason) {
    console.log('⚠️ [ADMIN SERVICE] warnUser called');
    console.log('   User ID:', userId);
    console.log('   Reason:', reason);
    
    try {
      const user = await db.User.findByPk(userId);
      
      if (!user) {
        console.log('❌ [ADMIN SERVICE] User not found:', userId);
        throw new Error('User not found');
      }
      
      console.log('   User found:', user.username);
      console.log('   Current violation count:', user.violationCount || 0);
      
      const violationCount = (user.violationCount || 0) + 1;
      
      let history = [];
      if (user.moderationHistory) {
        if (Array.isArray(user.moderationHistory)) {
          history = user.moderationHistory;
        } else if (typeof user.moderationHistory === 'string') {
          try {
            history = JSON.parse(user.moderationHistory);
          } catch (e) {
            history = [];
          }
        }
      }
      
      history.push({
        action: 'warning',
        reason,
        date: new Date(),
        warningNumber: violationCount
      });
      
      await user.update({
        violationCount,
        lastViolation: new Date(),
        moderationHistory: history
      });
      
      console.log('✅ [ADMIN SERVICE] User warned successfully');
      console.log('   New violation count:', violationCount);
      
      await notificationService.sendWarning(user, reason, violationCount);
      console.log('   Notification sent');
      
      return { user, violationCount };
    } catch (error) {
      console.error('❌ [ADMIN SERVICE] warnUser error:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  }

  async restoreUser(userId, adminId) {
    console.log('🔄 [ADMIN SERVICE] restoreUser called');
    console.log('   User ID:', userId);
    console.log('   Admin ID:', adminId);
    
    try {
      const user = await db.User.findByPk(userId);
      
      if (!user) {
        console.log('❌ [ADMIN SERVICE] User not found:', userId);
        throw new Error('User not found');
      }
      
      console.log('   User found:', user.username);
      console.log('   Previous status:', user.status);
      
      let history = [];
      if (user.moderationHistory) {
        if (Array.isArray(user.moderationHistory)) {
          history = user.moderationHistory;
        } else if (typeof user.moderationHistory === 'string') {
          try {
            history = JSON.parse(user.moderationHistory);
          } catch (e) {
            history = [];
          }
        }
      }
      
      history.push({
        action: 'restored',
        adminId,
        date: new Date(),
        previousStatus: user.status
      });
      
      await user.update({
        status: 'active',
        suspensionReason: null,
        suspendedUntil: null,
        banReason: null,
        bannedAt: null,
        bannedBy: null,
        moderationHistory: history,
        isActive: true
      });
      
      console.log('✅ [ADMIN SERVICE] User restored successfully');
      console.log('   New status:', user.status);
      
      await notificationService.sendUnban(user);
      console.log('   Notification sent');
      
      return user;
    } catch (error) {
      console.error('❌ [ADMIN SERVICE] restoreUser error:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    } 
  }
}

module.exports = new AdminService();