const db = require('../../database/models');
const { Op } = require('sequelize');

class IngredientService {
  async getAllIngredients(filters = {}) {
    const { category, search, limit = 100 } = filters;
    const where = {};
    
    if (category) where.category = category;
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { filipinoName: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const ingredients = await db.Ingredient.findAll({
      where,
      order: [['name', 'ASC']],
      limit: parseInt(limit)
    });
    
    return ingredients;
  }
  
  async getIngredientById(ingredientId) {
    const ingredient = await db.Ingredient.findByPk(ingredientId);
    
    if (!ingredient) {
      throw new Error('Ingredient not found');
    }
    
    return ingredient;
  }
  
  async createIngredient(ingredientData) {
    const { name, filipinoName, category, commonQuantity, unit, image, seasonal, description } = ingredientData;
    
    // Check if ingredient already exists
    const existing = await db.Ingredient.findOne({ where: { name } });
    if (existing) {
      throw new Error('Ingredient already exists');
    }
    
    const ingredient = await db.Ingredient.create({
      name,
      filipinoName,
      category,
      commonQuantity,
      unit,
      image,
      seasonal: seasonal || false,
      description
    });
    
    return ingredient;
  }
  
  async updateIngredient(ingredientId, ingredientData) {
    const ingredient = await db.Ingredient.findByPk(ingredientId);
    
    if (!ingredient) {
      throw new Error('Ingredient not found');
    }
    
    await ingredient.update(ingredientData);
    
    return ingredient;
  }
  
  async deleteIngredient(ingredientId) {
    const ingredient = await db.Ingredient.findByPk(ingredientId);
    
    if (!ingredient) {
      throw new Error('Ingredient not found');
    }
    
    // Check if ingredient is used in any recipes
    const usageCount = await db.RecipeIngredient.count({
      where: { ingredientId }
    });
    
    if (usageCount > 0) {
      throw new Error(`Cannot delete ingredient. It is used in ${usageCount} recipes.`);
    }
    
    await ingredient.destroy();
    return true;
  }
  
  async getIngredientsByCategory() {
    const ingredients = await db.Ingredient.findAll({
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    
    // Group by category
    const grouped = {};
    ingredients.forEach(ing => {
      const category = ing.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(ing);
    });
    
    return grouped;
  }
  
  async getPopularIngredients(limit = 10) {
    // Find ingredients most used in recipes
    const popular = await db.RecipeIngredient.findAll({
      attributes: [
        'ingredientId',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('ingredientId')), 'usageCount']
      ],
      where: {
        ingredientId: { [Op.ne]: null }
      },
      group: ['ingredientId'],
      order: [[db.Sequelize.fn('COUNT', db.Sequelize.col('ingredientId')), 'DESC']],
      limit: parseInt(limit),
      include: [{
        model: db.Ingredient,
        as: 'ingredient',
        attributes: ['name', 'category', 'image']
      }]
    });
    
    return popular.map(p => ({
      ...p.ingredient.toJSON(),
      usageCount: p.dataValues.usageCount
    }));
  }
}

module.exports = new IngredientService();