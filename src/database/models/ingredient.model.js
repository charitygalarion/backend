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
    prepTime: {
      type: DataTypes.INTEGER,
      field: 'prep_time'
    },
    cookTime: {
      type: DataTypes.INTEGER,
      field: 'cook_time'
    },
    servings: {
      type: DataTypes.INTEGER,
      defaultValue: 4
    },
    image: {
      type: DataTypes.STRING(500)
    },
    difficulty: {
      type: DataTypes.ENUM('Easy', 'Medium', 'Hard')
    },
    isFilipino: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_filipino'
    },
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    createdBy: {
      type: DataTypes.INTEGER,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'recipes'
  });

  Recipe.associate = (db) => {
    Recipe.belongsTo(db.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
    
    Recipe.belongsToMany(db.User, {
      through: db.UserSavedRecipe,
      foreignKey: 'recipe_id',
      otherKey: 'user_id',
      as: 'savedByUsers'
    });
    
    Recipe.hasMany(db.Instruction, {
      foreignKey: 'recipe_id',
      as: 'instructions'
    });
    
    Recipe.belongsToMany(db.Ingredient, {
      through: db.RecipeIngredient,
      foreignKey: 'recipe_id',
      otherKey: 'ingredient_id',
      as: 'ingredients'
    });
  };

  return Recipe;
};