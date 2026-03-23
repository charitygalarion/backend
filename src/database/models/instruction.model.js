module.exports = (sequelize, DataTypes) => {
  const Instruction = sequelize.define('Instruction', {
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
    stepNumber: {
      type: DataTypes.INTEGER,
      field: 'step_number',
      allowNull: false
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'instructions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  Instruction.associate = (db) => {
    Instruction.belongsTo(db.Recipe, {
      foreignKey: 'recipe_id',
      as: 'recipe'
    });
  };

  return Instruction;
};