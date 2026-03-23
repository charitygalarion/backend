const db = require('../../database/models');
const { Op } = require('sequelize');

class AdminService {
  async getStats() {
    const totalUsers = await db.User.count();
    const totalRecipes = await db.Recipe.count();
    const totalIngredients = await db.Ingredient.count();
    
    // Users active today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const usersActiveToday = await db.User.count({
      where: {
        lastActive: {
          [Op.between]: [startOfToday, endOfToday]
        }
      }
    });
    
    // Total recipes saved (distinct saved relationships)
    const totalRecipesSaved = await db.UserSavedRecipe.count({
      distinct: true,
      col: 'recipeId'
    });
    
    // Most viewed recipes (top 10)
    const mostViewedRecipes = await db.Recipe.findAll({
      attributes: ['id', 'title', 'views', 'mealType', 'image'],
      order: [['views', 'DESC']],
      limit: 10
    });
    
    // Recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const newUsersLast7Days = await db.User.count({
      where: {
        createdAt: { [Op.gte]: sevenDaysAgo }
      }
    });
    
    // Recent recipes (last 7 days)
    const newRecipesLast7Days = await db.Recipe.count({
      where: {
        createdAt: { [Op.gte]: sevenDaysAgo }
      }
    });
    
    return {
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
        mealType: r.mealType,
        image: r.image
      }))
    };
  }
  
  async getUserWithDetails(userId) {
    const user = await db.User.findByPk(userId, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get saved recipes
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
      }]
    });
    
    // Get user preferences
    const preferences = await db.UserPreference.findAll({ where: { userId } });
    
    return {
      ...user.toJSON(),
      savedRecipes: savedRecipes.map(sr => sr.recipe),
      mealTypes: preferences.filter(p => p.preferenceType === 'meal_type').map(p => p.value),
      dietaryRestrictions: preferences.filter(p => p.preferenceType === 'dietary_restriction').map(p => p.value)
    };
  }
  
  async getDashboardData() {
    // Get weekly stats (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const newUsers = await db.User.count({
        where: {
          createdAt: { [Op.between]: [date, nextDate] }
        }
      });
      
      const newRecipes = await db.Recipe.count({
        where: {
          createdAt: { [Op.between]: [date, nextDate] }
        }
      });
      
      weeklyData.push({
        date: date.toISOString().split('T')[0],
        newUsers,
        newRecipes
      });
    }
    
    // Get top contributors (users with most recipes)
    const topContributors = await db.Recipe.findAll({
      attributes: [
        'createdBy',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('createdBy')), 'recipeCount']
      ],
      group: ['createdBy'],
      order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('createdBy')), 'DESC']],
      limit: 5,
      include: [{
        model: db.User,
        as: 'creator',
        attributes: ['username', 'email', 'avatar']
      }]
    });
    
    return {
      weeklyStats: weeklyData,
      topContributors: topContributors.map(tc => ({
        user: tc.creator,
        recipeCount: tc.dataValues.recipeCount
      }))
    };
  }
  
  async deleteUser(userId) {
    const user = await db.User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.role === 'admin') {
      throw new Error('Cannot delete admin user');
    }
    
    await user.destroy();
    return true;
  }
}

module.exports = new AdminService();