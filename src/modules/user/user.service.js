const db = require('../../database/models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

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
}

module.exports = new UserService();