'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add status field
    await queryInterface.addColumn('users', 'status', {
      type: Sequelize.ENUM('active', 'suspended', 'banned'),
      defaultValue: 'active'
    });
    
    await queryInterface.addColumn('users', 'suspension_reason', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'suspended_until', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'ban_reason', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'banned_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'banned_by', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'moderation_notes', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'reported_images', {
      type: Sequelize.JSON,
      defaultValue: []
    });
    
    await queryInterface.addColumn('users', 'moderation_history', {
      type: Sequelize.JSON,
      defaultValue: []
    });
    
    await queryInterface.addColumn('users', 'violation_count', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    
    await queryInterface.addColumn('users', 'last_violation', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'status');
    await queryInterface.removeColumn('users', 'suspension_reason');
    await queryInterface.removeColumn('users', 'suspended_until');
    await queryInterface.removeColumn('users', 'ban_reason');
    await queryInterface.removeColumn('users', 'banned_at');
    await queryInterface.removeColumn('users', 'banned_by');
    await queryInterface.removeColumn('users', 'moderation_notes');
    await queryInterface.removeColumn('users', 'reported_images');
    await queryInterface.removeColumn('users', 'moderation_history');
    await queryInterface.removeColumn('users', 'violation_count');
    await queryInterface.removeColumn('users', 'last_violation');
    
    // Drop ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_status";');
  }
};