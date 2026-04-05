'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_notifications', {
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('warning', 'suspension', 'ban', 'unban', 'report', 'system'),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      severity: {
        type: Sequelize.ENUM('info', 'warning', 'danger', 'success'),
        defaultValue: 'info'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      action_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Add indexes
    await queryInterface.addIndex('user_notifications', ['user_id']);
    await queryInterface.addIndex('user_notifications', ['is_read']);
    await queryInterface.addIndex('user_notifications', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_notifications');
  }
};