const { Booking, Unit, Building, Project, Lead, User } = require('../models');
const BaseRepository = require('./base.repository');

class BookingRepository extends BaseRepository {
  constructor() {
    super(Booking);
  }

  /**
   * Find booking by primary key with unit, project, lead, and agent details
   * @param {number|string} id
   * @param {Object} options
   * @returns {Promise<Booking|null>}
   */
  async findByIdWithDetails(id, options = {}) {
    return this.model.findByPk(id, {
      include: [
        {
          model: Unit,
          as: 'unit',
          include: [
            {
              model: Building,
              as: 'building',
              include: [
                {
                  model: Project,
                  as: 'project',
                },
              ],
            },
          ],
        },
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'name', 'phone', 'email', 'stage'],
        },
        {
          model: User,
          as: 'bookedBy',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
      ...options,
    });
  }

  /**
   * Find booking by unique reference code
   * @param {string} bookingReference
   * @param {Object} options
   * @returns {Promise<Booking|null>}
   */
  async findByReference(bookingReference, options = {}) {
    return this.model.findOne({
      where: { booking_reference: bookingReference },
      ...options,
    });
  }

  /**
   * Find and count bookings with filters & associations
   * @param {Object} queryOptions
   * @returns {Promise<{ rows: Array<Booking>, count: number }>}
   */
  async findAndCountAllFiltered({ where = {}, limit = 20, offset = 0, order = [['created_at', 'DESC']] } = {}) {
    return this.model.findAndCountAll({
      where,
      limit,
      offset,
      order,
      distinct: true,
      include: [
        {
          model: Unit,
          as: 'unit',
          include: [
            {
              model: Building,
              as: 'building',
              include: [
                {
                  model: Project,
                  as: 'project',
                  attributes: ['id', 'name', 'location'],
                },
              ],
            },
          ],
        },
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'name', 'phone', 'email'],
        },
        {
          model: User,
          as: 'bookedBy',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
    });
  }
}

module.exports = new BookingRepository();
