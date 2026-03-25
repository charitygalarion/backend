'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column already exists
    const tableInfo = await queryInterface.describeTable('users');
    
    if (!tableInfo.token_version) {
      await queryInterface.addColumn('users', 'token_version', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: true
      });
      console.log('✅ Added token_version column to users table');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'token_version');
    console.log('✅ Removed token_version column from users table');
  }
};