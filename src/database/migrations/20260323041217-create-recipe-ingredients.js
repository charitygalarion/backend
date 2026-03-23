'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('recipe_ingredients', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      recipe_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'recipes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ingredient_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'ingredients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Ingredient name (can be custom or from master list)'
      },
      quantity: {
        type: Sequelize.STRING(50)
      },
      unit: {
        type: Sequelize.STRING(50)
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Order of ingredients in recipe'
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('recipe_ingredients', ['recipe_id']);
    await queryInterface.addIndex('recipe_ingredients', ['ingredient_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('recipe_ingredients');
  }
};