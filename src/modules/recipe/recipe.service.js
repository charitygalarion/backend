const db = require('../../database/models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

const geminiVision = require('../../services/geminiVision.service');

console.log('🔧 INSTRUCTION MODEL DEBUG:');
console.log('Instruction model attributes:', Object.keys(db.Instruction.rawAttributes));
console.log('🔧 RECIPE MODEL DEBUG:');
console.log('Recipe model attributes:', Object.keys(db.Recipe.rawAttributes));

class RecipeService {
  
 async getAllRecipes(filters = {}) {
  console.log('📖 [RECIPE SERVICE] getAllRecipes called');
  console.log('   Filters:', filters);
  
  const { mealType, difficulty, search, limit = 20, adminView = false } = filters;
  const where = {};
  
  if (mealType) where.mealType = mealType;
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
        attributes: ['name', 'quantity', 'unit', 'sort_order'],  // Use sort_order (snake_case)
        order: [['sort_order', 'ASC']]  // Use sort_order (snake_case)
      },
      {
        model: db.Instruction,
        as: 'instructions',
        attributes: ['step_number', 'text'],  // Use step_number (snake_case)
        order: [['step_number', 'ASC']]  // Use step_number (snake_case)
      }
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit)
  });
  
  if (adminView) {
    console.log(`👑 Admin viewing recipe list - Views NOT incremented`);
  }
  
  console.log(`✅ [RECIPE SERVICE] getAllRecipes returning ${recipes.length} recipes`);
  return recipes;
}

async getRecipeById(recipeId, userId = null, userRole = null) {
  console.log('🔍 [RECIPE SERVICE] getRecipeById called');
  console.log('   Recipe ID:', recipeId);
  console.log('   User role:', userRole);
  
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
    console.log('❌ [RECIPE SERVICE] Recipe not found:', recipeId);
    throw new Error('Recipe not found');
  }
  
  console.log('   Retrieved recipe values:', {
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings
  });
  
  if (userRole !== 'admin') {
    await recipe.increment('views');
    console.log(`📊 Views incremented for recipe: ${recipe.title}`);
  } else {
    console.log(`👑 Admin viewing recipe: ${recipe.title} - Views NOT incremented`);
  }
  
  return recipe;
}

  async createRecipe(recipeData, userId, imageFile = null, userRole = null) {
    console.log('📝 [RECIPE SERVICE] createRecipe called');
    console.log('   User ID:', userId);
    console.log('   User role:', userRole);
    console.log('   Has image:', !!imageFile);
    
    const title = recipeData.title;
    const description = recipeData.description || '';
    const mealType = recipeData.mealType;
    const difficulty = recipeData.difficulty;
    const isFilipino = recipeData.isFilipino !== undefined ? recipeData.isFilipino : true;
    
    const prepTime = parseInt(recipeData.prepTime) || 0;
    const cookTime = parseInt(recipeData.cookTime) || 0;
    const servings = parseInt(recipeData.servings) || 4;

    let ingredients = [];
    let instructions = [];
    
    if (recipeData.ingredients) {
      try {
        ingredients = typeof recipeData.ingredients === 'string' 
          ? JSON.parse(recipeData.ingredients) 
          : recipeData.ingredients;
        console.log('   Parsed ingredients count:', ingredients.length);
      } catch (e) {
        console.error('Failed to parse ingredients:', e);
      }
    }
    
    if (recipeData.instructions) {
      try {
        instructions = typeof recipeData.instructions === 'string' 
          ? JSON.parse(recipeData.instructions) 
          : recipeData.instructions;
        console.log('   Parsed instructions count:', instructions.length);
      } catch (e) {
        console.error('Failed to parse instructions:', e);
      }
    }
    
    if (!title || !title.trim()) throw new Error('Title is required');
    if (!mealType) throw new Error('Meal type is required');
    if (!difficulty) throw new Error('Difficulty is required');
    
    let imageUrl = null;
    if (imageFile) {
      imageUrl = `/uploads/recipes/${imageFile.filename}`;
    }
    
    console.log('   Creating recipe with values:', {
      title: title.trim(),
      mealType: mealType,
      prepTime: prepTime,
      cookTime: cookTime,
      servings: servings,
      difficulty: difficulty
    });
    
    // Use model attribute names (camelCase)
    const recipe = await db.Recipe.create({
      title: title.trim(),
      description: description,
      mealType: mealType,
      prepTime: prepTime,
      cookTime: cookTime,
      servings: servings,
      image: imageUrl,
      difficulty: difficulty,
      isFilipino: isFilipino,
      createdBy: userId,
      views: 0
    });
    
    console.log('✅ Recipe created with ID:', recipe.id);
    
    // Add ingredients - using model attribute names (camelCase)
    if (ingredients.length > 0) {
      const recipeIngredients = ingredients.map((ing, index) => ({
        recipeId: recipe.id,
        name: ing.name || '',
        quantity: ing.quantity || '',
        unit: ing.unit || '',
        sortOrder: index
      }));
      console.log('   Adding ingredients (camelCase):', recipeIngredients);
      await db.RecipeIngredient.bulkCreate(recipeIngredients);
      console.log('   ✅ Ingredients added');
    }
    
    // Add instructions - using model attribute names (camelCase)
    if (instructions.length > 0) {
      console.log('   🔍 INSTRUCTION DEBUG:');
      console.log('   Raw instructions data:', JSON.stringify(instructions, null, 2));
      
      const recipeInstructions = instructions.map((inst, index) => {
        let stepNumber = index + 1;
        
        if (inst.step && !isNaN(parseInt(inst.step))) {
          stepNumber = parseInt(inst.step);
          console.log(`     Using step: ${stepNumber}`);
        } else if (inst.step_number && !isNaN(parseInt(inst.step_number))) {
          stepNumber = parseInt(inst.step_number);
          console.log(`     Using step_number: ${stepNumber}`);
        } else {
          console.log(`     Using index: ${stepNumber}`);
        }
        
        return {
          recipeId: recipe.id,
          stepNumber: stepNumber,
          text: inst.text || inst.description || ''
        };
      });
      
      console.log('   Adding instructions (camelCase):', recipeInstructions);
      
      for (let i = 0; i < recipeInstructions.length; i++) {
        try {
          const created = await db.Instruction.create(recipeInstructions[i]);
          console.log(`   ✅ Instruction ${i} created:`, created.toJSON());
        } catch (err) {
          console.error(`   ❌ Failed to create instruction ${i}:`, err.message);
          console.error(`   Failed instruction data:`, recipeInstructions[i]);
          throw err;
        }
      }
    }
    
    console.log('✅ [RECIPE SERVICE] createRecipe completed');
    const createdRecipe = await this.getRecipeById(recipe.id, userId, userRole);
    console.log('   Created recipe values:', {
      prepTime: createdRecipe.prepTime,
      cookTime: createdRecipe.cookTime,
      servings: createdRecipe.servings
    });
    return createdRecipe;
  }

  async updateRecipe(recipeId, recipeData, imageFile = null, userId = null, userRole = null) {
    console.log('🔧 [RECIPE SERVICE] updateRecipe called');
    console.log('   Recipe ID:', recipeId);
    
    const recipe = await db.Recipe.findByPk(recipeId);
    
    if (!recipe) {
      console.log('❌ Recipe not found:', recipeId);
      throw new Error('Recipe not found');
    }
    
    // Use model attribute names (camelCase)
    console.log('   Current recipe values:', {
      title: recipe.title,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings
    });
    
    const prepTime = parseInt(recipeData.prepTime) || 0;
    const cookTime = parseInt(recipeData.cookTime) || 0;
    const servings = parseInt(recipeData.servings) || 4;
    
    console.log('   New values:', { prepTime, cookTime, servings });
    
    let ingredients = [];
    let instructions = [];
    
    if (recipeData.ingredients) {
      try {
        ingredients = typeof recipeData.ingredients === 'string' 
          ? JSON.parse(recipeData.ingredients) 
          : recipeData.ingredients;
        console.log('   Parsed ingredients count:', ingredients.length);
      } catch (e) {
        console.error('Failed to parse ingredients:', e);
      }
    }
    
    if (recipeData.instructions) {
      try {
        instructions = typeof recipeData.instructions === 'string' 
          ? JSON.parse(recipeData.instructions) 
          : recipeData.instructions;
        console.log('   Parsed instructions count:', instructions.length);
      } catch (e) {
        console.error('Failed to parse instructions:', e);
      }
    }
    
    let imageUrl = recipe.image;
    if (imageFile) {
      console.log('   Updating image');
      if (recipe.image) {
        const oldImagePath = path.join(__dirname, '../../../uploads/recipes', path.basename(recipe.image));
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('   Old image deleted');
        }
      }
      imageUrl = `/uploads/recipes/${imageFile.filename}`;
    }
    
    // Use model attribute names (camelCase)
    await recipe.update({
      title: recipeData.title,
      description: recipeData.description || '',
      mealType: recipeData.mealType,
      prepTime: prepTime,
      cookTime: cookTime,
      servings: servings,
      image: imageUrl,
      difficulty: recipeData.difficulty,
      isFilipino: recipeData.isFilipino !== undefined ? recipeData.isFilipino : true
    });
    
    console.log('✅ Recipe updated in database');
    
    // Update ingredients - using model attribute names (camelCase)
    await db.RecipeIngredient.destroy({ where: { recipeId: recipeId } });
    if (ingredients.length > 0) {
      const recipeIngredients = ingredients.map((ing, index) => ({
        recipeId: recipe.id,
        name: ing.name,
        quantity: ing.quantity || '',
        unit: ing.unit || '',
        sortOrder: index
      }));
      await db.RecipeIngredient.bulkCreate(recipeIngredients);
      console.log('   ✅ Ingredients updated:', ingredients.length);
    }
    
    // Update instructions - using model attribute names (camelCase)
    await db.Instruction.destroy({ where: { recipeId: recipeId } });
    if (instructions.length > 0) {
      const recipeInstructions = instructions.map((inst, index) => {
        let stepNumber = index + 1;
        
        if (inst.step && !isNaN(parseInt(inst.step))) {
          stepNumber = parseInt(inst.step);
        } else if (inst.step_number && !isNaN(parseInt(inst.step_number))) {
          stepNumber = parseInt(inst.step_number);
        }
        
        return {
          recipeId: recipe.id,
          stepNumber: stepNumber,
          text: inst.text || inst.description
        };
      });
      
      await db.Instruction.bulkCreate(recipeInstructions);
      console.log('   ✅ Instructions updated:', instructions.length);
    }
    
    console.log('✅ [RECIPE SERVICE] updateRecipe completed');
    return await this.getRecipeById(recipeId, userId, userRole);
  }

  async deleteRecipe(recipeId) {
    console.log('🗑️ [RECIPE SERVICE] deleteRecipe called');
    console.log('   Recipe ID:', recipeId);
    
    const recipe = await db.Recipe.findByPk(recipeId);
    
    if (!recipe) {
      console.log('❌ Recipe not found:', recipeId);
      throw new Error('Recipe not found');
    }
    
    if (recipe.image) {
      const imagePath = path.join(__dirname, '../../../uploads/recipes', path.basename(recipe.image));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('   Image deleted');
      }
    }
    
    await recipe.destroy();
    console.log('✅ Recipe deleted successfully');
    return true;
  }
  
  async findRecipesByIngredients(ingredientsList, mealType = null) {
    console.log('🔍 [RECIPE SERVICE] findRecipesByIngredients called');
    
    const searchIngredients = ingredientsList.map(ing => ing.toLowerCase());
    
    const where = {};
    if (mealType) where.mealType = mealType;
    
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
    console.log('🔧 [RECIPE SERVICE] adjustServings called');
    
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
    console.log('📚 [RECIPE SERVICE] getSavedRecipes called');
    
    try {
      const savedRecipes = await db.UserSavedRecipe.findAll({
        where: { userId: userId },
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
        order: [['savedAt', 'DESC']]
      });
      
      return savedRecipes.map(sr => sr.recipe).filter(recipe => recipe !== null);
    } catch (error) {
      console.error('Error in getSavedRecipes:', error);
      return [];
    }
  }
  
  async scanIngredientsFromImage(imageBuffer) {
    try {
      console.log('📸 Scanning ingredients from image...');
      
      const detectedIngredients = await geminiVision.detectIngredients(imageBuffer);
      const ingredientNames = detectedIngredients.map(i => i.name.toLowerCase());
      
      console.log('🔍 Detected:', ingredientNames.join(', '));
      
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


  // Add these methods to RecipeService class

async getRecentRecipes(limit = 6) {
  console.log('🆕 [RECIPE SERVICE] getRecentRecipes called');
  console.log('   Limit:', limit);
  
  const recipes = await db.Recipe.findAll({
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
  
  console.log(`✅ [RECIPE SERVICE] getRecentRecipes returning ${recipes.length} recipes`);
  return recipes;
}

async getPopularRecipes(limit = 6) {
  console.log('🔥 [RECIPE SERVICE] getPopularRecipes called');
  console.log('   Limit:', limit);
  
  const recipes = await db.Recipe.findAll({
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
    order: [['views', 'DESC']],
    limit: parseInt(limit)
  });
  
  console.log(`✅ [RECIPE SERVICE] getPopularRecipes returning ${recipes.length} recipes`);
  return recipes;
}


// Add this method to the RecipeService class
async generateFilipinoRecipe(ingredients) {
  console.log('🍳 Generating Filipino recipe from ingredients:', ingredients);
  
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const prompt = `You are a Filipino chef. Create an authentic Filipino recipe using these ingredients: ${ingredients.join(', ')}.

Return ONLY a valid JSON object with this exact structure, no other text:
{
  "title": "Recipe Name (in Filipino or English)",
  "description": "Brief description of the dish (1-2 sentences)",
  "mealType": "Breakfast" or "Lunch" or "Dinner" or "Snack",
  "difficulty": "Easy" or "Medium" or "Hard",
  "prepTime": number (minutes),
  "cookTime": number (minutes),
  "servings": number (2, 4, 6, 8),
  "ingredients": [
    { "name": "ingredient name", "quantity": "amount", "unit": "unit" }
  ],
  "instructions": [
    { "step": 1, "text": "instruction text" }
  ]
}

Rules:
- Must be an authentic Filipino dish
- Use the provided ingredients as the main components
- Suggest additional common Filipino ingredients if needed (garlic, onion, soy sauce, vinegar, etc.)
- Include cooking instructions typical of Filipino cuisine (sautéing, simmering, etc.)
- If ingredients don't match Filipino cooking, suggest the closest Filipino dish using available ingredients
- Make sure quantities are realistic`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📝 Gemini response received');
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const recipeData = JSON.parse(jsonMatch[0]);
      console.log('✅ Generated recipe:', recipeData.title);
      return recipeData;
    }
    
    console.log('⚠️ No JSON found, using fallback');
    return this.getFallbackFilipinoRecipe(ingredients);
    
  } catch (error) {
    console.error('❌ Gemini error:', error.message);
    return this.getFallbackFilipinoRecipe(ingredients);
  }
}

getFallbackFilipinoRecipe(ingredients) {
  const mainIngredient = ingredients[0] || 'chicken';
  return {
    title: `${mainIngredient.charAt(0).toUpperCase() + mainIngredient.slice(1)} Adobo Style`,
    description: `A delicious Filipino-style dish using ${ingredients.join(', ')}. Perfect with steamed rice.`,
    mealType: "Dinner",
    difficulty: "Medium",
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    ingredients: [
      ...ingredients.map(ing => ({ name: ing, quantity: "as needed", unit: "" })),
      { name: "soy sauce", quantity: "1/2", unit: "cup" },
      { name: "vinegar", quantity: "1/4", unit: "cup" },
      { name: "garlic", quantity: "6", unit: "cloves" },
      { name: "onion", quantity: "1", unit: "medium" },
      { name: "bay leaves", quantity: "2", unit: "pieces" },
      { name: "black pepper", quantity: "1", unit: "tsp" }
    ],
    instructions: [
      { step: 1, text: "Sauté garlic and onion until fragrant." },
      { step: 2, text: `Add ${ingredients.join(', ')} and cook until browned.` },
      { step: 3, text: "Pour in soy sauce and vinegar. Do not stir. Bring to a boil." },
      { step: 4, text: "Add bay leaves and black pepper. Simmer for 20-30 minutes." },
      { step: 5, text: "Serve hot with steamed rice." }
    ]
  };
}
}

module.exports = new RecipeService();