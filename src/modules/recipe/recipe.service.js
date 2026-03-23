const db = require('../../database/models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const huggingFaceVision = require('../../services/huggingFaceVision.service');


class RecipeService {
  async getAllRecipes(filters = {}) {
    const { mealType, difficulty, search, limit = 20 } = filters;
    const where = {};
    
    if (mealType) where.meal_type = mealType;
    if (difficulty) where.difficulty = difficulty;
    
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const recipes = await db.Recipe.findAll({
      where,
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['username', 'email']
        },
        {
          model: db.RecipeIngredient,
          as: 'ingredients',
          attributes: ['name', 'quantity', 'unit', 'sort_order'],
          order: [['sort_order', 'ASC']]
        },
        {
          model: db.Instruction,
          as: 'instructions',
          attributes: ['step_number', 'text'],
          order: [['step_number', 'ASC']]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit)
    });
    
    return recipes;
  }
  
  async getRecipeById(recipeId) {
    const recipe = await db.Recipe.findByPk(recipeId, {
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['username', 'email']
        },
        {
          model: db.RecipeIngredient,
          as: 'ingredients',
          attributes: ['name', 'quantity', 'unit', 'sort_order'],
          order: [['sort_order', 'ASC']]
        },
        {
          model: db.Instruction,
          as: 'instructions',
          attributes: ['step_number', 'text'],
          order: [['step_number', 'ASC']]
        }
      ]
    });
    
    if (!recipe) {
      throw new Error('Recipe not found');
    }
    
    await recipe.increment('views');
    
    return recipe;
  }
  
  async createRecipe(recipeData, userId, imageFile = null) {
    const {
      title,
      description,
      mealType,
      prepTime,
      cookTime,
      servings,
      difficulty,
      isFilipino,
      ingredients,
      instructions
    } = recipeData;
    
    // Handle image upload
    let imageUrl = null;
    if (imageFile) {
      imageUrl = `/uploads/recipes/${imageFile.filename}`;
    }
    
    // Create recipe
    const recipe = await db.Recipe.create({
      title,
      description,
      meal_type: mealType,
      prep_time: prepTime || 0,
      cook_time: cookTime || 0,
      servings: servings || 4,
      image: imageUrl,
      difficulty,
      is_filipino: isFilipino !== undefined ? isFilipino : true,
      created_by: userId,
      views: 0
    });
    
    // Add ingredients
    if (ingredients && ingredients.length) {
      let parsedIngredients = ingredients;
      if (typeof ingredients === 'string') {
        try {
          parsedIngredients = JSON.parse(ingredients);
        } catch (e) {
          parsedIngredients = [];
        }
      }
      
      const recipeIngredients = parsedIngredients.map((ing, index) => ({
        recipe_id: recipe.id,
        name: ing.name,
        quantity: ing.quantity || '',
        unit: ing.unit || '',
        sort_order: index
      }));
      await db.RecipeIngredient.bulkCreate(recipeIngredients);
    }
    
    // Add instructions
    if (instructions && instructions.length) {
      let parsedInstructions = instructions;
      if (typeof instructions === 'string') {
        try {
          parsedInstructions = JSON.parse(instructions);
        } catch (e) {
          parsedInstructions = [];
        }
      }
      
      const recipeInstructions = parsedInstructions.map((inst, index) => ({
        recipe_id: recipe.id,
        step_number: inst.step || index + 1,
        text: inst.text || inst.description
      }));
      await db.Instruction.bulkCreate(recipeInstructions);
    }
    
    return await this.getRecipeById(recipe.id);
  }
  
  async updateRecipe(recipeId, recipeData, imageFile = null) {
    const recipe = await db.Recipe.findByPk(recipeId);
    
    if (!recipe) {
      throw new Error('Recipe not found');
    }
    
    // Handle image upload
    let imageUrl = recipe.image;
    if (imageFile) {
      if (recipe.image) {
        const oldImagePath = path.join(__dirname, '../../../uploads/recipes', path.basename(recipe.image));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imageUrl = `/uploads/recipes/${imageFile.filename}`;
    }
    
    // Update recipe
    await recipe.update({
      title: recipeData.title,
      description: recipeData.description,
      meal_type: recipeData.mealType,
      prep_time: recipeData.prepTime,
      cook_time: recipeData.cookTime,
      servings: recipeData.servings,
      image: imageUrl,
      difficulty: recipeData.difficulty,
      is_filipino: recipeData.isFilipino
    });
    
    // Update ingredients
    if (recipeData.ingredients) {
      await db.RecipeIngredient.destroy({ where: { recipe_id: recipeId } });
      
      let parsedIngredients = recipeData.ingredients;
      if (typeof recipeData.ingredients === 'string') {
        try {
          parsedIngredients = JSON.parse(recipeData.ingredients);
        } catch (e) {
          parsedIngredients = [];
        }
      }
      
      const recipeIngredients = parsedIngredients.map((ing, index) => ({
        recipe_id: recipe.id,
        name: ing.name,
        quantity: ing.quantity || '',
        unit: ing.unit || '',
        sort_order: index
      }));
      await db.RecipeIngredient.bulkCreate(recipeIngredients);
    }
    
    // Update instructions
    if (recipeData.instructions) {
      await db.Instruction.destroy({ where: { recipe_id: recipeId } });
      
      let parsedInstructions = recipeData.instructions;
      if (typeof recipeData.instructions === 'string') {
        try {
          parsedInstructions = JSON.parse(recipeData.instructions);
        } catch (e) {
          parsedInstructions = [];
        }
      }
      
      const recipeInstructions = parsedInstructions.map((inst, index) => ({
        recipe_id: recipe.id,
        step_number: inst.step || index + 1,
        text: inst.text || inst.description
      }));
      await db.Instruction.bulkCreate(recipeInstructions);
    }
    
    return await this.getRecipeById(recipeId);
  }
  
  async deleteRecipe(recipeId) {
    const recipe = await db.Recipe.findByPk(recipeId);
    
    if (!recipe) {
      throw new Error('Recipe not found');
    }
    
    if (recipe.image) {
      const imagePath = path.join(__dirname, '../../../uploads/recipes', path.basename(recipe.image));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await recipe.destroy();
    return true;
  }
  
  async findRecipesByIngredients(ingredientsList, mealType = null) {
    const searchIngredients = ingredientsList.map(ing => ing.toLowerCase());
    
    const where = {};
    if (mealType) where.meal_type = mealType;
    
    const recipes = await db.Recipe.findAll({
      where,
      include: [
        {
          model: db.RecipeIngredient,
          as: 'ingredients',
          required: true
        },
        {
          model: db.User,
          as: 'creator',
          attributes: ['username', 'email']
        }
      ],
      order: [['views', 'DESC']]
    });
    
    const recipesWithMatch = recipes.map(recipe => {
      const recipeIngredients = recipe.ingredients || [];
      const recipeIngredientNames = recipeIngredients.map(ri => ri.name.toLowerCase());
      
      let matchCount = 0;
      const matchedIngredients = [];
      
      searchIngredients.forEach(searchIng => {
        const matched = recipeIngredientNames.some(recipeIng => 
          recipeIng.includes(searchIng) || searchIng.includes(recipeIng)
        );
        if (matched) {
          matchCount++;
          matchedIngredients.push(searchIng);
        }
      });
      
      const matchPercentage = recipeIngredients.length > 0 
        ? (matchCount / recipeIngredients.length) * 100 
        : 0;
      
      return {
        ...recipe.toJSON(),
        matchCount,
        matchPercentage: Math.round(matchPercentage),
        matchedIngredients
      };
    });
    
    return recipesWithMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);
  }
  
  async adjustServings(recipeId, newServings) {
    const recipe = await this.getRecipeById(recipeId);
    
    if (!recipe) {
      throw new Error('Recipe not found');
    }
    
    const ratio = newServings / recipe.servings;
    
    const adjustedIngredients = recipe.ingredients.map(ing => {
      if (ing.quantity && !isNaN(parseFloat(ing.quantity))) {
        const newQuantity = (parseFloat(ing.quantity) * ratio).toFixed(1);
        return {
          ...ing.toJSON(),
          quantity: newQuantity
        };
      }
      return ing;
    });
    
    return {
      ...recipe.toJSON(),
      servings: newServings,
      ingredients: adjustedIngredients
    };
  }
  
   async getSavedRecipes(userId) {
  try {
    const savedRecipes = await db.UserSavedRecipe.findAll({
      where: { user_id: userId },
      include: [{
        model: db.Recipe,
        as: 'recipe',
        required: false,
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
      order: [['saved_at', 'DESC']]
    }); 
    
    // Filter out null recipes
    const validRecipes = savedRecipes
      .map(sr => sr.recipe)
      .filter(recipe => recipe !== null);
    
    return validRecipes;
  } catch (error) {
    console.error('Error in getSavedRecipes:', error);
    return [];
  }
}

  async scanIngredientsFromImage(imageBuffer) {
    try {
      console.log('📸 Scanning ingredients from image...');
      
      // Detect using Hugging Face
      const detectedIngredients = await huggingFaceVision.detectIngredients(imageBuffer);
      
      const ingredientNames = detectedIngredients.map(i => i.name.toLowerCase());
      console.log('🔍 Detected:', ingredientNames.join(', '));
      
      // Find matching recipes
      const recipes = await this.findRecipesByIngredients(ingredientNames);
      
      return {
        detected: detectedIngredients,
        recipes: recipes
      };
    } catch (error) {
      console.error('❌ Scan error:', error);
      throw error;
    }
  }


}

module.exports = new RecipeService();