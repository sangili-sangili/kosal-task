const leadService = require('./lead.service');
const leadNoteRepository = require('../repositories/leadNote.repository');
const leadFollowupRepository = require('../repositories/leadFollowup.repository');
const { ROLES } = require('../constants/roles');
const { NotFoundError } = require('../utils/errors');
const logger = require('../config/logger');

class LeadActivityService {
  /**
   * Add a note to a lead prospect
   * @param {number|string} leadId
   * @param {string} noteText
   * @param {Object} currentUser
   * @returns {Promise<Object>}
   */
  async addNote(leadId, noteText, currentUser) {
    // Validate lead access rights
    await leadService.getLeadById(leadId, currentUser);

    const note = await leadNoteRepository.create({
      lead_id: parseInt(leadId, 10),
      user_id: currentUser.id,
      note: noteText.trim(),
    });

    const populatedNote = await leadNoteRepository.findByIdWithUser(note.id);
    logger.info(`Note added to Lead ID ${leadId} by User ID ${currentUser.id}`);
    return populatedNote;
  }

  /**
   * Get all notes for a specific lead
   * @param {number|string} leadId
   * @param {Object} currentUser
   * @returns {Promise<Array>}
   */
  async getNotes(leadId, currentUser) {
    await leadService.getLeadById(leadId, currentUser);
    return leadNoteRepository.findByLeadId(leadId);
  }

  /**
   * Schedule a follow-up for a lead
   * @param {number|string} leadId
   * @param {Object} followupData
   * @param {Object} currentUser
   * @returns {Promise<Object>}
   */
  async addFollowup(leadId, followupData, currentUser) {
    const lead = await leadService.getLeadById(leadId, currentUser);

    const assigneeId =
      currentUser.role === ROLES.SALES
        ? currentUser.id
        : followupData.assigned_to || currentUser.id;

    const followup = await leadFollowupRepository.create({
      lead_id: parseInt(leadId, 10),
      assigned_to: assigneeId,
      follow_up_date: new Date(followupData.follow_up_date),
      remarks: followupData.remarks ? followupData.remarks.trim() : null,
      status: 'PENDING',
    });

    // Update lead's top-level follow_up_date for quick dashboard overview
    const dateOnly = new Date(followupData.follow_up_date).toISOString().split('T')[0];
    await lead.update({ follow_up_date: dateOnly });

    const populatedFollowup = await leadFollowupRepository.findByIdWithUser(followup.id);
    logger.info(`Follow-up scheduled for Lead ID ${leadId} at ${followupData.follow_up_date} by User ID ${currentUser.id}`);
    return populatedFollowup;
  }

  /**
   * Get all follow-ups for a specific lead
   * @param {number|string} leadId
   * @param {Object} currentUser
   * @returns {Promise<Array>}
   */
  async getFollowups(leadId, currentUser) {
    await leadService.getLeadById(leadId, currentUser);
    return leadFollowupRepository.findByLeadId(leadId);
  }

  /**
   * Update follow-up status (PENDING, COMPLETED, CANCELLED)
   * @param {number|string} leadId
   * @param {number|string} followupId
   * @param {string} status
   * @param {string|null} remarks
   * @param {Object} currentUser
   * @returns {Promise<Object>}
   */
  async updateFollowupStatus(leadId, followupId, status, remarks, currentUser) {
    await leadService.getLeadById(leadId, currentUser);

    const followup = await leadFollowupRepository.findById(followupId);
    if (!followup || followup.lead_id !== parseInt(leadId, 10)) {
      throw new NotFoundError(`Follow-up with ID ${followupId} was not found for this lead`, 'FOLLOWUP_NOT_FOUND');
    }

    const updatePayload = { status };
    if (remarks !== undefined) {
      updatePayload.remarks = remarks;
    }

    await followup.update(updatePayload);
    const updatedFollowup = await leadFollowupRepository.findByIdWithUser(followupId);

    logger.info(`Follow-up ID ${followupId} status changed to ${status} by User ID ${currentUser.id}`);
    return updatedFollowup;
  }
}

module.exports = new LeadActivityService();
