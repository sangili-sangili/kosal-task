const { LeadNote, User } = require('../models');
const BaseRepository = require('./base.repository');

class LeadNoteRepository extends BaseRepository {
  constructor() {
    super(LeadNote);
  }

  /**
   * Find all notes for a specific lead ordered chronologically descending
   * @param {number|string} leadId
   * @returns {Promise<Array<LeadNote>>}
   */
  async findByLeadId(leadId) {
    return this.model.findAll({
      where: { lead_id: leadId },
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
    });
  }

  /**
   * Find a single note by ID with author details
   * @param {number|string} id
   * @returns {Promise<LeadNote|null>}
   */
  async findByIdWithUser(id) {
    return this.model.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role'],
        },
      ],
    });
  }
}

module.exports = new LeadNoteRepository();
