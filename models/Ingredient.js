// backend/models/Ingredient.js
const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  filipinoName: String,
  category: {
    type: String,
    enum: ['Vegetable', 'Fruit', 'Meat', 'Seafood', 'Spice', 'Dairy', 'Grain', 'Other']
  },
  commonQuantity: String,
  unit: String,
  image: String,
  seasonal: Boolean,
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Ingredient', ingredientSchema);