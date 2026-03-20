// backend/models/Recipe.js
const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  mealType: {
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
    required: true
  },
  ingredients: [{
    name: String,
    quantity: String,
    unit: String,
    filipinoName: String
  }],
  instructions: [{
    step: Number,
    description: String,
    image: String
  }],
  prepTime: Number, // in minutes
  cookTime: Number, // in minutes
  servings: {
    type: Number,
    default: 4
  },
  image: String,
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard']
  },
  category: [String],
  isFilipino: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to adjust servings
recipeSchema.methods.adjustServings = function(targetServings) {
  const ratio = targetServings / this.servings;
  const adjustedIngredients = this.ingredients.map(ing => ({
    ...ing.toObject(),
    quantity: parseFloat(ing.quantity) * ratio
  }));
  
  return {
    ...this.toObject(),
    servings: targetServings,
    ingredients: adjustedIngredients
  };
};

module.exports = mongoose.model('Recipe', recipeSchema);