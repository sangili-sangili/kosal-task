const leadActivityService = require('../services/leadActivity.service');
const { sendSuccess, sendCreated } = require('../utils/response');

class LeadActivityController {
  /**
   * Add a note to a lead
   * POST /api/v1/leads/:id/notes
   */
  async addNote(req, res, next) {
    try {
      const note = await leadActivityService.addNote(req.params.id, req.body.note, req.user);
      return sendCreated(res, 'Note added successfully', { note });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * List all notes for a lead
   * GET /api/v1/leads/:id/notes
   */
  async getNotes(req, res, next) {
    try {
      const notes = await leadActivityService.getNotes(req.params.id, req.user);
      return sendSuccess(res, 'Notes retrieved successfully', { notes });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Schedule a follow-up for a lead
   * POST /api/v1/leads/:id/followups
   */
  async addFollowup(req, res, next) {
    try {
      const followup = await leadActivityService.addFollowup(req.params.id, req.body, req.user);
      return sendCreated(res, 'Follow-up scheduled successfully', { followup });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * List all follow-ups for a lead
   * GET /api/v1/leads/:id/followups
   */
  async getFollowups(req, res, next) {
    try {
      const followups = await leadActivityService.getFollowups(req.params.id, req.user);
      return sendSuccess(res, 'Follow-ups retrieved successfully', { followups });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Update follow-up status
   * PATCH /api/v1/leads/:id/followups/:followupId
   */
  async updateFollowupStatus(req, res, next) {
    try {
      const followup = await leadActivityService.updateFollowupStatus(
        req.params.id,
        req.params.followupId,
        req.body.status,
        req.body.remarks,
        req.user
      );
      return sendSuccess(res, 'Follow-up status updated successfully', { followup });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new LeadActivityController();
