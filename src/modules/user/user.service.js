const db = require('../../database/models');
const { Op } = require('sequelize');

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
    
    const savedRecipeIds = savedRecipes.map(sr => sr.recipeId);
    
    return {
      ...user.toJSON(),
      savedRecipes: savedRecipeIds
    };
  }
  
  async updateProfile(userId, updateData) {
    const { username, email, firstName, lastName, mealTypes, dietaryRestrictions } = updateData;
    
    const user = await db.User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if username/email already taken (excluding current user)
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
    
    // Update user
    await user.update({
      username: username || user.username,
      email: email || user.email,
      firstName: firstName !== undefined ? firstName : user.firstName,
      lastName: lastName !== undefined ? lastName : user.lastName
    });
    
    // Update preferences if provided
    if (mealTypes || dietaryRestrictions) {
      // Clear existing preferences
      await db.UserPreference.destroy({ where: { userId } });
      
      // Add meal types
      if (mealTypes && mealTypes.length) {
        const mealPrefs = mealTypes.map(type => ({
          userId,
          preferenceType: 'meal_type',
          value: type
        }));
        await db.UserPreference.bulkCreate(mealPrefs);
      }
      
      // Add dietary restrictions
      if (dietaryRestrictions && dietaryRestrictions.length) {
        const dietPrefs = dietaryRestrictions.map(restriction => ({
          userId,
          preferenceType: 'dietary_restriction',
          value: restriction
        }));
        await db.UserPreference.bulkCreate(dietPrefs);
      }
    }
    
    // Get updated user with preferences
    const updatedUser = await db.User.findByPk(userId, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
    });
    
    const preferences = await db.UserPreference.findAll({ where: { userId } });
    const mealTypePrefs = preferences.filter(p => p.preferenceType === 'meal_type').map(p => p.value);
    const dietaryPrefs = preferences.filter(p => p.preferenceType === 'dietary_restriction').map(p => p.value);
    
    return {
      ...updatedUser.toJSON(),
      mealTypes: mealTypePrefs,
      dietaryRestrictions: dietaryPrefs
    };
  }
  
  async toggleSaveRecipe(userId, recipeId) {
    // Check if recipe exists
    const recipe = await db.Recipe.findByPk(recipeId);
    if (!recipe) {
      throw new Error('Recipe not found');
    }
    
    // Check if already saved
    const existing = await db.UserSavedRecipe.findOne({
      where: { userId, recipeId }
    });
    
    if (existing) {
      // Remove from saved
      await db.UserSavedRecipe.destroy({
        where: { userId, recipeId }
      });
      return { isSaved: false };
    } else {
      // Add to saved
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
        include: [{
          model: db.User,
          as: 'creator',
          attributes: ['username', 'email']
        }]
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
    } else if (status === 'inactive') {
      where.isActive = false;
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
    
    // Get saved recipes count for each user
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
}

module.exports = new UserService();