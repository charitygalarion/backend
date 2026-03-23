const ingredientService = require('./ingredient.service');
const { transformResponse } = require('../../utils/response.util');

exports.getIngredients = async (req, res) => {
  try {
    const { category, search, limit } = req.query;
    const ingredients = await ingredientService.getAllIngredients({
      category,
      search,
      limit
    });
    res.json(transformResponse(ingredients));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getIngredientById = async (req, res) => {
  try {
    const { id } = req.params;
    const ingredient = await ingredientService.getIngredientById(id);
    res.json(transformResponse(ingredient));
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.createIngredient = async (req, res) => {
  try {
    const ingredient = await ingredientService.createIngredient(req.body);
    res.status(201).json(transformResponse(ingredient));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const ingredient = await ingredientService.updateIngredient(id, req.body);
    res.json(transformResponse(ingredient));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    await ingredientService.deleteIngredient(id);
    res.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getIngredientsByCategory = async (req, res) => {
  try {
    const grouped = await ingredientService.getIngredientsByCategory();
    res.json(grouped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPopularIngredients = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const popular = await ingredientService.getPopularIngredients(limit);
    res.json(transformResponse(popular));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};