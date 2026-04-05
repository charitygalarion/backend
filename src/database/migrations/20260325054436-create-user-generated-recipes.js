'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_generated_recipes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      meal_type: {
        type: Sequelize.ENUM('Breakfast', 'Lunch', 'Dinner', 'Snack'),
        allowNull: false
      },
      difficulty: {
        type: Sequelize.ENUM('Easy', 'Medium', 'Hard'),
        allowNull: false
      },
      prep_time: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      cook_time: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      servings: {
        type: Sequelize.INTEGER,
        defaultValue: 4
      },
      ingredients: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      instructions: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      image: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      is_filipino: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_generated_recipes');
  }
};