const leadService = require('../services/lead.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');

class LeadController {
  /**
   * Create a new lead
   * POST /api/v1/leads
   */
  async create(req, res, next) {
    try {
      const lead = await leadService.createLead(req.body, req.user);
      return sendCreated(res, 'Lead created successfully', { lead });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * List all leads with filters & pagination
   * GET /api/v1/leads
   */
  async list(req, res, next) {
    try {
      const { leads, pagination } = await leadService.getLeads(req.query, req.user);
      return sendPaginated(res, 'Leads retrieved successfully', leads, pagination);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Get single lead by ID
   * GET /api/v1/leads/:id
   */
  async getById(req, res, next) {
    try {
      const lead = await leadService.getLeadById(req.params.id, req.user);
      return sendSuccess(res, 'Lead retrieved successfully', { lead });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Update lead details
   * PATCH /api/v1/leads/:id
   */
  async update(req, res, next) {
    try {
      const lead = await leadService.updateLead(req.params.id, req.body, req.user);
      return sendSuccess(res, 'Lead updated successfully', { lead });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Update lead stage
   * PATCH /api/v1/leads/:id/stage
   */
  async updateStage(req, res, next) {
    try {
      const lead = await leadService.updateLeadStage(req.params.id, req.body.stage, req.user);
      return sendSuccess(res, 'Lead stage updated successfully', { lead });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Delete lead
   * DELETE /api/v1/leads/:id
   */
  async delete(req, res, next) {
    try {
      await leadService.deleteLead(req.params.id, req.user);
      return sendSuccess(res, 'Lead deleted successfully', null);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new LeadController();
