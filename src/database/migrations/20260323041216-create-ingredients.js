'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ingredients', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      filipino_name: {
        type: Sequelize.STRING(100)
      },
      category: {
        type: Sequelize.ENUM('Vegetable', 'Fruit', 'Meat', 'Seafood', 'Spice', 'Dairy', 'Grain', 'Other')
      },
      common_quantity: {
        type: Sequelize.STRING(50)
      },
      unit: {
        type: Sequelize.STRING(50)
      },
      image: {
        type: Sequelize.STRING(500)
      },
      seasonal: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      description: {
        type: Sequelize.TEXT
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
    await queryInterface.dropTable('ingredients');
  }
};