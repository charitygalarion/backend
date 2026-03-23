// backend/models/Ingredient.js
const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  filipinoName: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['Vegetable', 'Fruit', 'Meat', 'Seafood', 'Spice', 'Dairy', 'Grain', 'Other']
  },
  commonQuantity: {
    type: String
  },
  unit: {
    type: String
  },
  image: {
    type: String
  },
  seasonal: {
    type: Boolean
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Ingredient', ingredientSchema);
