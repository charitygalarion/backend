const db = require('../../database/models');
const { Op } = require('sequelize');

class AdminService {
  async getStats() {
    const totalUsers = await db.User.count();
    const totalRecipes = await db.Recipe.count();
    const totalIngredients = await db.Ingredient.count();
    
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
    
    const totalRecipesSaved = await db.UserSavedRecipe.count({
      distinct: true,
      col: 'recipe_id'
    });
    
    const mostViewedRecipes = await db.Recipe.findAll({
      attributes: ['id', 'title', 'views', 'meal_type', 'image'],
      order: [['views', 'DESC']],
      limit: 10
    });
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const newUsersLast7Days = await db.User.count({
      where: {
        created_at: { [Op.gte]: sevenDaysAgo }
      }
    });
    
    const newRecipesLast7Days = await db.Recipe.count({
      where: {
        created_at: { [Op.gte]: sevenDaysAgo }
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
        mealType: r.meal_type,
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
    
    const savedRecipes = await db.UserSavedRecipe.findAll({
      where: { user_id: userId },
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
    
    const preferences = await db.UserPreference.findAll({ 
      where: { user_id: userId } 
    });
    
    return {
      ...user.toJSON(),
      savedRecipes: savedRecipes.map(sr => sr.recipe),
      mealTypes: preferences.filter(p => p.preference_type === 'meal_type').map(p => p.value),
      dietaryRestrictions: preferences.filter(p => p.preference_type === 'dietary_restriction').map(p => p.value)
    };
  }

  async getDashboardData() {
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