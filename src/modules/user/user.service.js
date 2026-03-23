const db = require('../../database/models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const notificationService = require('../notification/notification.service');

class UserService {
  async getProfile(userId) {
    const user = await db.User.findByPk(userId, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get saved recipes IDs
    const savedRecipes = await db.UserSavedRecipe.findAll({
      where: { userId: user.id },
      attributes: ['recipeId']
    });
    
    // Get user preferences
    const preferences = await db.UserPreference.findAll({ where: { userId: user.id } });
    
    const savedRecipeIds = savedRecipes.map(sr => sr.recipeId);
    
    return {
      ...user.toJSON(),
      savedRecipes: savedRecipeIds,
      mealTypes: preferences.filter(p => p.preferenceType === 'meal_type').map(p => p.value),
      dietaryRestrictions: preferences.filter(p => p.preferenceType === 'dietary_restriction').map(p => p.value)
    };
  }
  
  async updateProfile(userId, updateData, imageFile = null) {
    try {
      const { username, email, firstName, lastName, mealTypes, dietaryRestrictions } = updateData;
      
      console.log('UserService.updateProfile called with:', { userId, updateData, hasImage: !!imageFile });
      
      const user = await db.User.findByPk(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Handle profile image upload
      let avatarUrl = user.avatar;
      if (imageFile) {
        console.log('Processing image file:', imageFile.filename);
        if (user.avatar) {
          const oldAvatarPath = path.join(__dirname, '../../../uploads/profiles', path.basename(user.avatar));
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        }
        avatarUrl = `/uploads/profiles/${imageFile.filename}`;
      }
      
      // Check if username/email already taken
      if (username || email) {
        const where = {};
        if (username) where.username = username;
        if (email) where.email = email;
        
        const existingUser = await db.User.findOne({
          where: {
            ...where,
            id: { [Op.ne]: userId }
          }
        });
        
        if (existingUser) {
          throw new Error('Username or email already taken');
        }
      }
      
      // Build update object
      const updateFields = {};
      if (username !== undefined) updateFields.username = username;
      if (email !== undefined) updateFields.email = email;
      if (firstName !== undefined) updateFields.firstName = firstName;
      if (lastName !== undefined) updateFields.lastName = lastName;
      if (avatarUrl) updateFields.avatar = avatarUrl;
      
      console.log('Updating user with fields:', updateFields);
      
      await user.update(updateFields);
      
      return await this.getProfile(userId);
    } catch (error) {
      console.error('Error in updateProfile service:', error);
      throw error;
    }
  }
  
  async toggleSaveRecipe(userId, recipeId) {
    const recipe = await db.Recipe.findByPk(recipeId);
    if (!recipe) {
      throw new Error('Recipe not found');
    }
    
    const existing = await db.UserSavedRecipe.findOne({
      where: { userId, recipeId }
    });
    
    if (existing) {
      await db.UserSavedRecipe.destroy({
        where: { userId, recipeId }
      });
      return { isSaved: false };
    } else {
      await db.UserSavedRecipe.create({
        userId,
        recipeId,
        savedAt: new Date()
      });
      return { isSaved: true };
    }
  }
  
  async getSavedRecipes(userId) {
    const savedRecipes = await db.UserSavedRecipe.findAll({
      where: { userId },
      include: [{
        model: db.Recipe,
        as: 'recipe',
        include: [
          {
            model: db.User,
            as: 'creator',
            attributes: ['username', 'email']
          },
          {
            model: db.RecipeIngredient,
            as: 'ingredients',
            attributes: ['name', 'quantity', 'unit']
          }
        ]
      }],
      order: [['savedAt', 'DESC']]
    });
    
    return savedRecipes.map(sr => sr.recipe);
  }
  
  async getAllUsers(filters = {}) {
    const { status } = filters;
    const where = {};
    
    if (status === 'active') {
      where.isActive = true;
      where.status = 'active';
    } else if (status === 'suspended') {
      where.status = 'suspended';
    } else if (status === 'banned') {
      where.status = 'banned';
    } else if (status === 'activeToday') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      
      where.lastActive = {
        [Op.between]: [startOfToday, endOfToday]
      };
    }
    
    const users = await db.User.findAll({
      where,
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
      order: [['lastActive', 'DESC']]
    });
    
    const usersWithCount = await Promise.all(users.map(async (user) => {
      const savedCount = await db.UserSavedRecipe.count({
        where: { userId: user.id }
      });
      
      return {
        ...user.toJSON(),
        savedRecipesCount: savedCount
      };
    }));
    
    return usersWithCount;
  }
  
  async deleteUser(userId) {
    const user = await db.User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    await user.destroy();
    return true;
  }

  async getUserDetails(userId) {
    const user = await db.User.findByPk(userId, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get saved recipes count
    const savedRecipesCount = await db.UserSavedRecipe.count({
      where: { user_id: userId }
    });
    
    // Get recipes created by user
    const recipes = await db.Recipe.findAll({
      where: { created_by: userId },
      attributes: ['id', 'title', 'image', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    
    // Get reported images
    const reportedImages = user.reportedImages || [];
    
    return {
      ...user.toJSON(),
      savedRecipesCount,
      recipes,
      reportedImages
    };
  }

  async suspendUser(userId, adminId, reason, durationDays = 7) {
    const user = await db.User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.role === 'admin') {
      throw new Error('Cannot suspend admin users');
    }
    
    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + durationDays);
    
    // Add to moderation history
    const history = user.moderationHistory || [];
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
    
    // Send notification
    await notificationService.sendSuspension(user, reason, durationDays, suspendedUntil);
    
    return user;
  }

  async banUser(userId, adminId, reason) {
    const user = await db.User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.role === 'admin') {
      throw new Error('Cannot ban admin users');
    }
    
    // Add to moderation history
    const history = user.moderationHistory || [];
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
    
    // Send notification
    await notificationService.sendBan(user, reason);
    
    return user;
  }

  async warnUser(userId, reason) {
    const user = await db.User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const violationCount = (user.violationCount || 0) + 1;
    
    // Add to moderation history
    const history = user.moderationHistory || [];
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
    
    // Send notification
    await notificationService.sendWarning(user, reason, violationCount);
    
    return { user, violationCount };
  }

  async restoreUser(userId, adminId) {
    const user = await db.User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Add to moderation history
    const history = user.moderationHistory || [];
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
    
    // Send notification
    await notificationService.sendUnban(user);
    
    return user;
  }
}

module.exports = new UserService();