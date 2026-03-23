module.exports = (sequelize, DataTypes) => {
  const UserSavedRecipe = sequelize.define('UserSavedRecipe', {
    userId: {
      type: DataTypes.INTEGER,
      field: 'user_id',
      primaryKey: true
    },
    recipeId: {
      type: DataTypes.INTEGER,
      field: 'recipe_id',
      primaryKey: true
    },
    savedAt: {
      type: DataTypes.DATE,
      field: 'saved_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'user_saved_recipes',
    timestamps: false
  });

  return UserSavedRecipe;
};