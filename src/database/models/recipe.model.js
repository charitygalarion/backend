module.exports = (sequelize, DataTypes) => {
  const Recipe = sequelize.define('Recipe', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    mealType: {
      type: DataTypes.ENUM('Breakfast', 'Lunch', 'Dinner', 'Snack'),
      field: 'meal_type'
    },
    difficulty: {
      type: DataTypes.ENUM('Easy', 'Medium', 'Hard')
    }
  }, {
    tableName: 'recipes',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Recipe.associate = (db) => {
    Recipe.belongsTo(db.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
    
    // Add these associations
    Recipe.hasMany(db.RecipeIngredient, {
      foreignKey: 'recipe_id',
      as: 'ingredients'
    });
    
    Recipe.hasMany(db.Instruction, {
      foreignKey: 'recipe_id',
      as: 'instructions'
    });
    
    Recipe.belongsToMany(db.User, {
      through: db.UserSavedRecipe,
      foreignKey: 'recipe_id',
      otherKey: 'user_id',
      as: 'savedByUsers'
    });
  };

  return Recipe;
};