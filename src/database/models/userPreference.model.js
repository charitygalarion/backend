module.exports = (sequelize, DataTypes) => {
  const UserPreference = sequelize.define('UserPreference', {
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
    preferenceType: {
      type: DataTypes.ENUM('meal_type', 'dietary_restriction'),
      field: 'preference_type',
      allowNull: false
    },
    value: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    tableName: 'user_preferences',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  UserPreference.associate = (db) => {
    UserPreference.belongsTo(db.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return UserPreference;
};