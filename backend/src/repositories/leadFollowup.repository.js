const { LeadFollowup, User } = require('../models');
const BaseRepository = require('./base.repository');

class LeadFollowupRepository extends BaseRepository {
  constructor() {
    super(LeadFollowup);
  }

  /**
   * Find all follow-ups for a specific lead ordered chronologically
   * @param {number|string} leadId
   * @returns {Promise<Array<LeadFollowup>>}
   */
  async findByLeadId(leadId) {
    return this.model.findAll({
      where: { lead_id: leadId },
      order: [['follow_up_date', 'ASC']],
      include: [
        {
          model: User,
          as: 'assignedSalesEmployee',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
    });
  }

  /**
   * Find a single follow-up by ID with assigned user details
   * @param {number|string} id
   * @returns {Promise<LeadFollowup|null>}
   */
  async findByIdWithUser(id) {
    return this.model.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignedSalesEmployee',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
    });
  }
}

module.exports = new LeadFollowupRepository();
