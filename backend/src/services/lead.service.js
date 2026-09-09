const { Op } = require('sequelize');
const leadRepository = require('../repositories/lead.repository');
const userRepository = require('../repositories/user.repository');
const { ROLES } = require('../constants/roles');
const { parsePaginationParams, formatPaginationResponse } = require('../utils/pagination');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../utils/errors');
const logger = require('../config/logger');

class LeadService {
  /**
   * Create a new lead prospect
   * @param {Object} leadData
   * @param {Object} currentUser
   * @returns {Promise<Object>}
   */
  async createLead(leadData, currentUser) {
    const payload = { ...leadData };
    payload.created_by = currentUser.id;

    // Sales employees default to assigning the lead to themselves if unassigned
    if (currentUser.role === ROLES.SALES) {
      payload.assigned_to = payload.assigned_to || currentUser.id;
    } else if (payload.assigned_to) {
      // If admin assigns someone, verify that target user exists and is active
      const assignee = await userRepository.findById(payload.assigned_to);
      if (!assignee || !assignee.is_active) {
        throw new BadRequestError('Assigned sales representative does not exist or is inactive', 'INVALID_ASSIGNEE');
      }
    }

    // Clean empty string inputs to null
    if (payload.email === '') payload.email = null;
    if (payload.follow_up_date === '') payload.follow_up_date = null;

    const created = await leadRepository.create(payload);
    const lead = await leadRepository.findById(created.id);

    logger.info(`Lead created: ID ${lead.id} (${lead.name}) by user ID ${currentUser.id}`);
    return lead;
  }

  /**
   * List leads with role-based scoping, filtering, and pagination
   * @param {Object} queryParams
   * @param {Object} currentUser
   * @returns {Promise<{ leads: Array, pagination: Object }>}
   */
  async getLeads(queryParams, currentUser) {
    const { page, limit, offset, search, order } = parsePaginationParams(
      queryParams,
      'created_at',
      ['id', 'name', 'email', 'phone', 'stage', 'source', 'follow_up_date', 'created_at']
    );

    const conditions = [];

    // 1. Role-Based Scoping: Sales employees can only access assigned or created leads
    if (currentUser.role === ROLES.SALES) {
      conditions.push({
        [Op.or]: [
          { assigned_to: currentUser.id },
          { created_by: currentUser.id },
        ],
      });
    } else if (queryParams.assigned_to) {
      // Admin filter by specific sales rep
      const repId = parseInt(queryParams.assigned_to, 10);
      if (!isNaN(repId)) {
        conditions.push({ assigned_to: repId });
      }
    }

    // 2. Stage Filter
    if (queryParams.stage) {
      conditions.push({ stage: queryParams.stage });
    }

    // 3. Search Term (Prospect Name, Phone, Email)
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push({
        [Op.or]: [
          { name: { [Op.like]: searchPattern } },
          { phone: { [Op.like]: searchPattern } },
          { email: { [Op.like]: searchPattern } },
        ],
      });
    }

    const where = conditions.length > 0 ? { [Op.and]: conditions } : {};

    const { rows, count } = await leadRepository.findAndCountAllFiltered({
      where,
      limit,
      offset,
      order,
    });

    const pagination = formatPaginationResponse(count, page, limit);

    return {
      leads: rows,
      pagination,
    };
  }

  /**
   * Retrieve a single lead by ID with permission checks
   * @param {number|string} id
   * @param {Object} currentUser
   * @returns {Promise<Object>}
   */
  async getLeadById(id, currentUser) {
    const lead = await leadRepository.findById(id);
    if (!lead) {
      throw new NotFoundError(`Lead with ID ${id} was not found`, 'LEAD_NOT_FOUND');
    }

    // Scoping enforcement for SALES role
    if (
      currentUser.role === ROLES.SALES &&
      lead.assigned_to !== currentUser.id &&
      lead.created_by !== currentUser.id
    ) {
      throw new ForbiddenError('You are not authorized to view this lead', 'FORBIDDEN');
    }

    return lead;
  }

  /**
   * Update lead details
   * @param {number|string} id
   * @param {Object} updateData
   * @param {Object} currentUser
   * @returns {Promise<Object>}
   */
  async updateLead(id, updateData, currentUser) {
    const lead = await leadRepository.findById(id);
    if (!lead) {
      throw new NotFoundError(`Lead with ID ${id} was not found`, 'LEAD_NOT_FOUND');
    }

    // Scoping enforcement for SALES role
    if (
      currentUser.role === ROLES.SALES &&
      lead.assigned_to !== currentUser.id &&
      lead.created_by !== currentUser.id
    ) {
      throw new ForbiddenError('You are not authorized to modify this lead', 'FORBIDDEN');
    }

    const payload = { ...updateData };

    // Sales cannot reassign leads to someone else
    if (currentUser.role === ROLES.SALES) {
      delete payload.assigned_to;
    } else if (payload.assigned_to) {
      const assignee = await userRepository.findById(payload.assigned_to);
      if (!assignee || !assignee.is_active) {
        throw new BadRequestError('Assigned sales representative does not exist or is inactive', 'INVALID_ASSIGNEE');
      }
    }

    if (payload.email === '') payload.email = null;
    if (payload.follow_up_date === '') payload.follow_up_date = null;

    await lead.update(payload);
    const updatedLead = await leadRepository.findById(id);

    logger.info(`Lead ID ${id} updated by user ID ${currentUser.id}`);
    return updatedLead;
  }

  /**
   * Change a lead's pipeline stage
   * @param {number|string} id
   * @param {string} stage
   * @param {Object} currentUser
   * @returns {Promise<Object>}
   */
  async updateLeadStage(id, stage, currentUser) {
    const lead = await leadRepository.findById(id);
    if (!lead) {
      throw new NotFoundError(`Lead with ID ${id} was not found`, 'LEAD_NOT_FOUND');
    }

    if (
      currentUser.role === ROLES.SALES &&
      lead.assigned_to !== currentUser.id &&
      lead.created_by !== currentUser.id
    ) {
      throw new ForbiddenError('You are not authorized to change the stage of this lead', 'FORBIDDEN');
    }

    const oldStage = lead.stage;
    await lead.update({ stage });
    const updatedLead = await leadRepository.findById(id);

    logger.info(`Lead ID ${id} stage changed from ${oldStage} -> ${stage} by user ID ${currentUser.id}`);
    return updatedLead;
  }

  /**
   * Delete a lead (Admin only)
   * @param {number|string} id
   * @param {Object} currentUser
   * @returns {Promise<boolean>}
   */
  async deleteLead(id, currentUser) {
    if (currentUser.role !== ROLES.ADMIN) {
      throw new ForbiddenError('Only administrators are permitted to delete leads', 'FORBIDDEN');
    }

    const lead = await leadRepository.findById(id);
    if (!lead) {
      throw new NotFoundError(`Lead with ID ${id} was not found`, 'LEAD_NOT_FOUND');
    }

    await lead.destroy();
    logger.info(`Lead ID ${id} soft-deleted by admin ID ${currentUser.id}`);
    return true;
  }
}

module.exports = new LeadService();
