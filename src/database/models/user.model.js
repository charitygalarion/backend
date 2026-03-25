const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      validate: { len: [3, 30] }
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING(100),
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING(100),
      field: 'last_name'
    },
    avatar: {
      type: DataTypes.STRING(500)
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    lastActive: {
      type: DataTypes.DATE,
      field: 'last_active'
    },
    resetPasswordToken: {
      type: DataTypes.STRING(255),
      field: 'reset_password_token'
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      field: 'reset_password_expires'
    },
    
    // ✅ Moderation Fields
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'banned'),
      defaultValue: 'active',
      field: 'status'
    },
    suspensionReason: {
      type: DataTypes.TEXT,
      field: 'suspension_reason'
    },
    suspendedUntil: {
      type: DataTypes.DATE,
      field: 'suspended_until'
    },
    banReason: {
      type: DataTypes.TEXT,
      field: 'ban_reason'
    },
    bannedAt: {
      type: DataTypes.DATE,
      field: 'banned_at'
    },
    bannedBy: {
      type: DataTypes.INTEGER,
      field: 'banned_by'
    },
    moderationNotes: {
      type: DataTypes.TEXT,
      field: 'moderation_notes'
    },
    
    // ✅ Reported Content
    reportedImages: {
      type: DataTypes.JSON,
      field: 'reported_images',
      defaultValue: []
    },
    moderationHistory: {
      type: DataTypes.JSON,
      field: 'moderation_history',
      defaultValue: []
    },
    
    // ✅ Violation Count
    violationCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'violation_count'
    },
    lastViolation: {
      type: DataTypes.DATE,
      field: 'last_violation'
    },
    
    // ✅ Token Version for session invalidation (NEW)
    tokenVersion: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'token_version'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.associate = (db) => {
    User.hasMany(db.Recipe, {
      foreignKey: 'created_by',
      as: 'recipes'
    });
    
    User.belongsToMany(db.Recipe, {
      through: db.UserSavedRecipe,
      foreignKey: 'user_id',
      otherKey: 'recipe_id',
      as: 'savedRecipes'
    });
    
    User.hasMany(db.UserPreference, {
      foreignKey: 'user_id',
      as: 'preferences'
    });
  };

  return User;
};