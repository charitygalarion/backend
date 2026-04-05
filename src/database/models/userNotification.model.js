module.exports = (sequelize, DataTypes) => {
  const UserNotification = sequelize.define('UserNotification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      field: 'user_id',
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('warning', 'suspension', 'ban', 'unban', 'report', 'system'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    severity: {
      type: DataTypes.ENUM('info', 'warning', 'danger', 'success'),
      defaultValue: 'info'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read'
    },
    actionUrl: {
      type: DataTypes.STRING(500),
      field: 'action_url',
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    expiresAt: {
      type: DataTypes.DATE,
      field: 'expires_at',
      allowNull: true
    },
    readAt: {
      type: DataTypes.DATE,
      field: 'read_at',
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'user_notifications',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  UserNotification.associate = (db) => {
    UserNotification.belongsTo(db.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return UserNotification;
};