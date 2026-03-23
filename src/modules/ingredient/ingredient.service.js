const db = require('../../database/models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

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
  
  async createIngredient(ingredientData, imageFile = null) {
    const { name, filipinoName, category, commonQuantity, unit, seasonal, description } = ingredientData;
    
    // Check if ingredient already exists
    const existing = await db.Ingredient.findOne({ where: { name } });
    if (existing) {
      throw new Error('Ingredient already exists');
    }
    
    // Handle image upload
    let imageUrl = null;
    if (imageFile) {
      imageUrl = `/uploads/ingredients/${imageFile.filename}`;
    }
    
    const ingredient = await db.Ingredient.create({
      name,
      filipinoName,
      category,
      commonQuantity,
      unit,
      image: imageUrl,
      seasonal: seasonal === 'true' || seasonal === true || false,
      description
    });
    
    return ingredient;
  }
  
  async updateIngredient(ingredientId, ingredientData, imageFile = null) {
    const ingredient = await db.Ingredient.findByPk(ingredientId);
    
    if (!ingredient) {
      throw new Error('Ingredient not found');
    }
    
    // Handle image upload
    let imageUrl = ingredient.image;
    if (imageFile) {
      // Delete old image if exists
      if (ingredient.image) {
        const oldImagePath = path.join(__dirname, '../../../uploads/ingredients', path.basename(ingredient.image));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageUrl = `/uploads/ingredients/${imageFile.filename}`;
    }
    
    await ingredient.update({
      name: ingredientData.name || ingredient.name,
      filipinoName: ingredientData.filipinoName !== undefined ? ingredientData.filipinoName : ingredient.filipinoName,
      category: ingredientData.category || ingredient.category,
      commonQuantity: ingredientData.commonQuantity !== undefined ? ingredientData.commonQuantity : ingredient.commonQuantity,
      unit: ingredientData.unit !== undefined ? ingredientData.unit : ingredient.unit,
      image: imageUrl,
      seasonal: ingredientData.seasonal !== undefined ? ingredientData.seasonal : ingredient.seasonal,
      description: ingredientData.description !== undefined ? ingredientData.description : ingredient.description
    });
    
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
    
    // Delete image if exists
    if (ingredient.image) {
      const imagePath = path.join(__dirname, '../../../uploads/ingredients', path.basename(ingredient.image));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await ingredient.destroy();
    return true;
  }
  
  async getIngredientsByCategory() {
    const ingredients = await db.Ingredient.findAll({
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    
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