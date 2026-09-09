const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../constants/roles');

class User extends Model {
  /**
   * Compare a candidate password with the user's password hash
   */
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password_hash);
  }

  /**
   * Hash a plain text password
   */
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Redact sensitive fields when serialized to JSON
   */
  toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  }
}

function initUserModel(sequelize) {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'User name cannot be empty' },
          len: { args: [2, 100], msg: 'User name must be between 2 and 100 characters' },
        },
      },
      email: {
        type: DataTypes.STRING(191),
        allowNull: false,
        unique: {
          name: 'idx_users_email',
          msg: 'A user with this email already exists',
        },
        validate: {
          isEmail: { msg: 'Must be a valid email address' },
          notEmpty: { msg: 'Email is required' },
        },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Password hash cannot be empty' },
        },
      },
      role: {
        type: DataTypes.ENUM(ROLES.ADMIN, ROLES.SALES),
        allowNull: false,
        defaultValue: ROLES.SALES,
        validate: {
          isIn: {
            args: [[ROLES.ADMIN, ROLES.SALES]],
            msg: `Role must be either ${ROLES.ADMIN} or ${ROLES.SALES}`,
          },
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      underscored: true,
      timestamps: true,
      paranoid: true, // Enables soft delete via deleted_at
      defaultScope: {
        attributes: { exclude: ['password_hash'] },
      },
      scopes: {
        withPassword: {
          attributes: {},
        },
      },
    }
  );

  return User;
}

module.exports = {
  User,
  initUserModel,
};
