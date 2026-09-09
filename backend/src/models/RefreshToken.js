const { DataTypes, Model } = require('sequelize');

class RefreshToken extends Model {
  get isExpired() {
    return Date.now() >= this.expiresAt.getTime();
  }

  get isActive() {
    return !this.isRevoked && !this.isExpired;
  }
}

function initRefreshTokenModel(sequelize) {
  RefreshToken.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      tokenHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        field: 'token_hash',
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expires_at',
      },
      isRevoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_revoked',
      },
      revokedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'revoked_at',
      },
      replacedByTokenHash: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: 'replaced_by_token_hash',
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'ip_address',
      },
      userAgent: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'user_agent',
      },
    },
    {
      sequelize,
      modelName: 'RefreshToken',
      tableName: 'refresh_tokens',
      timestamps: true,
      paranoid: false,
      indexes: [
        {
          fields: ['token_hash'],
        },
        {
          fields: ['user_id', 'is_revoked'],
        },
      ],
    }
  );

  return RefreshToken;
}

module.exports = {
  RefreshToken,
  initRefreshTokenModel,
};
