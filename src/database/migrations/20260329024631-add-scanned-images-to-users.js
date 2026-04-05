// migrations/[timestamp]-add-scanned-images-to-users.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'scanned_images', {
      type: Sequelize.JSON,
      defaultValue: [],
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'scanned_images');
  }
};