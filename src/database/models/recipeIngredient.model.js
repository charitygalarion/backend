module.exports = (sequelize, DataTypes) => {
  const RecipeIngredient = sequelize.define('RecipeIngredient', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    recipeId: {
      type: DataTypes.INTEGER,
      field: 'recipe_id'
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
  };

  return RecipeIngredient;
};