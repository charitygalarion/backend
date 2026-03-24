'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('recipes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      meal_type: {
        type: Sequelize.ENUM('Breakfast', 'Lunch', 'Dinner', 'Snack')
      },
      prep_time: {
        type: Sequelize.INTEGER,
        comment: 'Preparation time in minutes'
      },
      cook_time: {
        type: Sequelize.INTEGER,
        comment: 'Cooking time in minutes'
      },
      servings: {
        type: Sequelize.INTEGER,
        defaultValue: 4
      },
      image: {
        type: Sequelize.STRING(500)
      },
      difficulty: {
        type: Sequelize.ENUM('Easy', 'Medium', 'Hard')
      },
      is_filipino: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      views: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('recipes');
  }
};