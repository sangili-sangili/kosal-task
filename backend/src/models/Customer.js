const { DataTypes, Model } = require('sequelize');

class Customer extends Model {}

function initCustomerModel(sequelize) {
  Customer.init(
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
        type: DataTypes.STRING(60),
        allowNull: false,
        field: 'first_name',
      },
      lastName: {
        type: DataTypes.STRING(60),
        allowNull: false,
        field: 'last_name',
      },
      email: {
        type: DataTypes.STRING(191),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      phone: {
        type: DataTypes.STRING(25),
        allowNull: false,
      },
      company: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'LEAD', 'CHURNED'),
        defaultValue: 'LEAD',
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Customer',
      tableName: 'customers',
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ['email'],
        },
        {
          fields: ['status', 'created_at'],
        },
      ],
    }
  );

  return Customer;
}

module.exports = {
  Customer,
  initCustomerModel,
};
