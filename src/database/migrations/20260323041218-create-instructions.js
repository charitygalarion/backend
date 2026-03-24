'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('instructions', {
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
      step_number: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add composite unique constraint
    await queryInterface.addIndex('instructions', ['recipe_id', 'step_number'], {
      unique: true,
      name: 'unique_recipe_step'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('instructions');
  }
};