const { Model, DataTypes } = require('sequelize');
const { BOOKING_STATUS, BOOKING_STATUS_VALUES } = require('../constants/bookingStatus');

class Booking extends Model {
  /**
   * Helper to format human-readable booking reference
   */
  static generateReferenceNumber(sequenceNumber = 1) {
    const year = new Date().getFullYear();
    const padded = String(sequenceNumber).padStart(6, '0');
    return `BK-${year}-${padded}`;
  }

  /**
   * Check if booking is actively confirmed
   */
  isConfirmed() {
    return this.status === BOOKING_STATUS.CONFIRMED;
  }
}

function initBookingModel(sequelize) {
  Booking.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      booking_reference: {
        type: DataTypes.STRING(60),
        allowNull: false,
        unique: {
          name: 'idx_bookings_booking_reference',
          msg: 'Booking reference must be unique',
        },
        validate: {
          notEmpty: { msg: 'Booking reference is required' },
        },
      },
      lead_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'leads',
          key: 'id',
        },
        validate: {
          notNull: { msg: 'Lead ID is required' },
        },
      },
      unit_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'units',
          key: 'id',
        },
        validate: {
          notNull: { msg: 'Unit ID is required' },
        },
      },
      booked_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        validate: {
          notNull: { msg: 'Booked by User ID is required' },
        },
      },
      booking_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        validate: {
          isDate: { msg: 'Booking date must be a valid date' },
        },
      },
      amount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        validate: {
          isDecimal: { msg: 'Booking amount must be a decimal value' },
          min: { args: [0], msg: 'Booking amount cannot be negative' },
        },
      },
      status: {
        type: DataTypes.ENUM(...BOOKING_STATUS_VALUES),
        allowNull: false,
        defaultValue: BOOKING_STATUS.CONFIRMED,
        validate: {
          isIn: {
            args: [BOOKING_STATUS_VALUES],
            msg: `Status must be one of: ${BOOKING_STATUS_VALUES.join(', ')}`,
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'Booking',
      tableName: 'bookings',
      underscored: true,
      timestamps: true,
      paranoid: true,
      scopes: {
        confirmed: {
          where: { status: BOOKING_STATUS.CONFIRMED },
        },
        cancelled: {
          where: { status: BOOKING_STATUS.CANCELLED },
        },
      },
    }
  );

  return Booking;
}

module.exports = {
  Booking,
  initBookingModel,
};
