module.exports = (sequelize, DataTypes) => {
  const RecipeIngredient = sequelize.define('RecipeIngredient', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    recipeId: {
      type: DataTypes.INTEGER,
      field: 'recipe_id',
      allowNull: false
    },
    ingredientId: {
      type: DataTypes.INTEGER,
      field: 'ingredient_id',
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    quantity: {
      type: DataTypes.STRING(50)
    },
    unit: {
      type: DataTypes.STRING(50)
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      field: 'sort_order',
      defaultValue: 0
    }
  }, {
    tableName: 'recipe_ingredients',
    timestamps: false
  });

  RecipeIngredient.associate = (db) => {
    RecipeIngredient.belongsTo(db.Recipe, {
      foreignKey: 'recipe_id',
      as: 'recipe'
    });
    
    RecipeIngredient.belongsTo(db.Ingredient, {
      foreignKey: 'ingredient_id',
      as: 'ingredient'
    });
  };

  return RecipeIngredient;
};