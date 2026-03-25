module.exports = (sequelize, DataTypes) => {
  const UserGeneratedRecipe = sequelize.define('UserGeneratedRecipe', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      field: 'user_id',
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    mealType: {
      type: DataTypes.ENUM('Breakfast', 'Lunch', 'Dinner', 'Snack'),
      field: 'meal_type',
      allowNull: false
    },
    difficulty: {
      type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
      allowNull: false
    },
    prepTime: {
      type: DataTypes.INTEGER,
      field: 'prep_time',
      defaultValue: 0
    },
    cookTime: {
      type: DataTypes.INTEGER,
      field: 'cook_time',
      defaultValue: 0
    },
    servings: {
      type: DataTypes.INTEGER,
      defaultValue: 4
    },
    ingredients: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    instructions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    isFilipino: {
      type: DataTypes.BOOLEAN,
      field: 'is_filipino',
      defaultValue: true
    }
  }, {
    tableName: 'user_generated_recipes',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  UserGeneratedRecipe.associate = (db) => {
    UserGeneratedRecipe.belongsTo(db.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return UserGeneratedRecipe;
};