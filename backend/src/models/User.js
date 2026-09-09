const { DataTypes, Model } = require('sequelize');

class User extends Model {
  // Exclude password and sensitive tokens in JSON serialization
  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}

function initUserModel(sequelize) {
  User.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true,
      },
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'first_name',
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'last_name',
      },
      email: {
        type: DataTypes.STRING(191),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
        defaultValue: 'ACTIVE',
        allowNull: false,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login_at',
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ['email'],
        },
        {
          fields: ['status', 'created_at'],
        },
        {
          fields: ['uuid'],
        },
      ],
    }
  );

  return User;
}

module.exports = {
  User,
  initUserModel,
};
