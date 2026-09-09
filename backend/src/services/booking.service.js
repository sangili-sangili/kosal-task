const { Op } = require('sequelize');
const { sequelize, Booking, Unit, Lead } = require('../models');
const { BOOKING_STATUS, BOOKING_STATUS_VALUES } = require('../constants/bookingStatus');
const { UNIT_STATUS } = require('../constants/unitStatus');
const { LEAD_STAGES } = require('../constants/leadStages');
const { ROLES } = require('../constants/roles');
const {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  UnitAlreadyBookedError,
} = require('../utils/errors');
const { parsePaginationParams, formatPaginationResponse } = require('../utils/pagination');
const bookingRepository = require('../repositories/booking.repository');
const logger = require('../config/logger');

class BookingService {
  /**
   * Create a unit booking with double-booking prevention (MySQL transaction + LOCK.UPDATE)
   * @param {Object} bookingData
   * @param {Object} currentUser
   * @returns {Promise<Object>}
   */
  async createBooking(bookingData, currentUser) {
    const { lead_id, unit_id, amount, booking_date } = bookingData;

    // 1. Begin Database Managed Transaction
    const transaction = await sequelize.transaction();

    try {
      // 2. CRITICAL ROW LOCK: SELECT ... FOR UPDATE
      const unit = await Unit.findByPk(unit_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!unit) {
        throw new NotFoundError(`Unit with ID ${unit_id} does not exist`, 'UNIT_NOT_FOUND');
      }

      // 3. Double-Booking Prevention Check
      if (unit.status !== UNIT_STATUS.AVAILABLE) {
        logger.warn(
          `Double-booking attempt prevented: Unit ${unit.unit_number} (ID ${unit.id}) is in '${unit.status}' status`
        );
        throw new UnitAlreadyBookedError(
          `Unit ${unit.unit_number} is already ${unit.status.toLowerCase()} and cannot be booked`
        );
      }

      // 4. Verify Lead existence and permissions
      const lead = await Lead.findByPk(lead_id, { transaction });
      if (!lead) {
        throw new NotFoundError(`Lead with ID ${lead_id} does not exist`, 'LEAD_NOT_FOUND');
      }

      // Role scoping: Sales employee can only book for their assigned or created leads
      if (
        currentUser.role === ROLES.SALES &&
        lead.assigned_to !== currentUser.id &&
        lead.created_by !== currentUser.id
      ) {
        throw new ForbiddenError('You are not authorized to create a booking for this lead', 'FORBIDDEN');
      }

      if (lead.stage === LEAD_STAGES.LOST) {
        throw new BadRequestError('Cannot book a unit for a lead in LOST stage', 'INVALID_LEAD_STAGE');
      }

      // 5. Update Unit status to BOOKED
      await unit.update({ status: UNIT_STATUS.BOOKED }, { transaction });

      // 6. Update Lead stage to BOOKED
      await lead.update({ stage: LEAD_STAGES.BOOKED }, { transaction });

      // 7. Generate a unique booking reference
      const year = new Date().getFullYear();
      const uniqueSuffix = `${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;
      const bookingReference = `BK-${year}-${uniqueSuffix}`;

      // 8. Create the Booking Record
      const booking = await Booking.create(
        {
          booking_reference: bookingReference,
          lead_id,
          unit_id,
          booked_by: currentUser.id,
          booking_date: booking_date ? new Date(booking_date) : new Date(),
          amount: amount !== undefined ? amount : unit.price,
          status: BOOKING_STATUS.CONFIRMED,
          payment_status: 'TOKEN_RECEIVED',
        },
        { transaction }
      );

      // 9. Commit Transaction atomically
      await transaction.commit();

      logger.info(
        `Booking ${booking.booking_reference} confirmed for Unit ID ${unit.id} by User ID ${currentUser.id}`
      );

      // Fetch and return full populated booking
      return bookingRepository.findByIdWithDetails(booking.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Cancel an existing booking and release the unit back to AVAILABLE
   * @param {number|string} bookingId
   * @param {Object} currentUser
   * @param {string} [reason]
   * @returns {Promise<Object>}
   */
  async cancelBooking(bookingId, currentUser, reason = '') {
    const transaction = await sequelize.transaction();

    try {
      const booking = await Booking.findByPk(bookingId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!booking) {
        throw new NotFoundError(`Booking with ID ${bookingId} was not found`, 'BOOKING_NOT_FOUND');
      }

      if (booking.status === BOOKING_STATUS.CANCELLED) {
        throw new BadRequestError('This booking is already cancelled', 'ALREADY_CANCELLED');
      }

      // Only Admin or the booking agent can cancel
      if (currentUser.role !== ROLES.ADMIN && booking.booked_by !== currentUser.id) {
        throw new ForbiddenError('You do not have permission to cancel this booking', 'FORBIDDEN');
      }

      // Update booking status and save cancellation reason
      await booking.update(
        {
          status: BOOKING_STATUS.CANCELLED,
          cancellation_reason: reason || 'Customer requested cancellation',
        },
        { transaction }
      );

      // Release unit back to AVAILABLE
      const unit = await Unit.findByPk(booking.unit_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (unit) {
        await unit.update({ status: UNIT_STATUS.AVAILABLE }, { transaction });
      }

      await transaction.commit();

      logger.info(`Booking ${booking.booking_reference} cancelled, unit released back to AVAILABLE`);
      return bookingRepository.findByIdWithDetails(booking.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update booking status and payment status
   * @param {number|string} bookingId
   * @param {Object} updateData
   * @param {Object} currentUser
   * @returns {Promise<Object>}
   */
  async updateBookingStatus(bookingId, updateData, currentUser) {
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      throw new NotFoundError(`Booking with ID ${bookingId} was not found`, 'BOOKING_NOT_FOUND');
    }

    if (currentUser.role !== ROLES.ADMIN && booking.booked_by !== currentUser.id) {
      throw new ForbiddenError('You do not have permission to update this booking', 'FORBIDDEN');
    }

    const { status, payment_status, cancellation_reason } = updateData;

    // If changing to CANCELLED, invoke cancelBooking to release the unit
    if (status === BOOKING_STATUS.CANCELLED && booking.status !== BOOKING_STATUS.CANCELLED) {
      return this.cancelBooking(bookingId, currentUser, cancellation_reason);
    }

    const updates = {};
    if (status && BOOKING_STATUS_VALUES.includes(status)) {
      updates.status = status;
    }
    if (payment_status) {
      updates.payment_status = payment_status;
    }

    await booking.update(updates);
    logger.info(`Booking ID ${bookingId} status updated: status=${updates.status || booking.status}`);
    return bookingRepository.findByIdWithDetails(bookingId);
  }

  /**
   * List bookings with role scoping and pagination
   * @param {Object} queryParams
   * @param {Object} currentUser
   * @returns {Promise<{ bookings: Array, pagination: Object }>}
   */
  async getBookings(queryParams, currentUser) {
    const { page, limit, offset, search, order } = parsePaginationParams(
      queryParams,
      'created_at',
      ['id', 'booking_reference', 'booking_date', 'amount', 'status', 'created_at']
    );

    const where = {};
    const projectWhere = {};

    if (currentUser.role === ROLES.SALES) {
      where.booked_by = currentUser.id;
    } else if (queryParams.agent_id || queryParams.booked_by) {
      where.booked_by = parseInt(queryParams.agent_id || queryParams.booked_by, 10);
    }

    if (queryParams.status) {
      where.status = queryParams.status;
    }

    if (queryParams.payment_status) {
      where.payment_status = queryParams.payment_status;
    }

    if (queryParams.project_id) {
      projectWhere.id = parseInt(queryParams.project_id, 10);
    }

    if (search) {
      where.booking_reference = { [Op.like]: `%${search}%` };
    }

    const { rows, count } = await bookingRepository.findAndCountAllFiltered({
      where,
      projectWhere,
      limit,
      offset,
      order,
    });

    const pagination = formatPaginationResponse(count, page, limit);

    return {
      bookings: rows,
      pagination,
    };
  }

  /**
   * Get single booking by ID with scoping
   * @param {number|string} id
   * @param {Object} currentUser
   * @returns {Promise<Object>}
   */
  async getBookingById(id, currentUser) {
    const booking = await bookingRepository.findByIdWithDetails(id);
    if (!booking) {
      throw new NotFoundError(`Booking with ID ${id} was not found`, 'BOOKING_NOT_FOUND');
    }

    if (currentUser.role === ROLES.SALES && booking.booked_by !== currentUser.id) {
      throw new ForbiddenError('You do not have permission to view this booking', 'FORBIDDEN');
    }

    return booking;
  }
}

module.exports = new BookingService();
