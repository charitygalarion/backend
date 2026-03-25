const { sequelize } = require('../../../config/database');
const Sequelize = require('sequelize');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./user.model')(sequelize, Sequelize);
db.Recipe = require('./recipe.model')(sequelize, Sequelize);
db.Ingredient = require('./ingredient.model')(sequelize, Sequelize);
db.RecipeIngredient = require('./recipeIngredient.model')(sequelize, Sequelize);
db.Instruction = require('./instruction.model')(sequelize, Sequelize);
db.UserSavedRecipe = require('./userSavedRecipe.model')(sequelize, Sequelize);
db.UserPreference = require('./userPreference.model')(sequelize, Sequelize);
db.UserNotification = require('./userNotification.model')(sequelize, Sequelize);  // ADD THIS LINE

// Setup associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Log available models for debugging
console.log('📦 Available models:', Object.keys(db));

module.exports = db;