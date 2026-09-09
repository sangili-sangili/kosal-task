const { DataTypes, Model } = require('sequelize');

class Account extends Model {}

function initAccountModel(sequelize) {
  Account.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      customerId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        field: 'customer_id',
        references: {
          model: 'customers',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      accountNumber: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
        field: 'account_number',
      },
      accountType: {
        type: DataTypes.ENUM('SAVINGS', 'CHECKING', 'CREDIT'),
        defaultValue: 'CHECKING',
        allowNull: false,
        field: 'account_type',
      },
      balance: {
        type: DataTypes.DECIMAL(14, 2),
        defaultValue: 0.00,
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'FROZEN', 'CLOSED'),
        defaultValue: 'ACTIVE',
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Account',
      tableName: 'accounts',
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ['account_number'],
        },
        {
          fields: ['customer_id', 'status'],
        },
      ],
    }
  );

  return Account;
}

module.exports = {
  Account,
  initAccountModel,
};
