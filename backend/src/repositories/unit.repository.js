const { Unit, Building, Project } = require('../models');
const BaseRepository = require('./base.repository');

class UnitRepository extends BaseRepository {
  constructor() {
    super(Unit);
  }

  /**
   * Find a single unit by ID with full parent Building and Project details
   * @param {number|string} id
   * @param {Object} options
   * @returns {Promise<Unit|null>}
   */
  async findByIdWithDetails(id, options = {}) {
    return this.model.findByPk(id, {
      include: [
        {
          model: Building,
          as: 'building',
          attributes: ['id', 'name', 'project_id'],
          include: [
            {
              model: Project,
              as: 'project',
              attributes: ['id', 'name', 'location'],
            },
          ],
        },
      ],
      ...options,
    });
  }

  /**
   * Check for duplicate unit number in the same building
   * @param {number|string} buildingId
   * @param {string} unitNumber
   * @returns {Promise<Unit|null>}
   */
  async findByBuildingAndNumber(buildingId, unitNumber) {
    return this.model.findOne({
      where: {
        building_id: buildingId,
        unit_number: unitNumber.trim(),
      },
    });
  }

  /**
   * Find and count units matching inventory filter parameters
   * @param {Object} queryOptions
   * @returns {Promise<{ rows: Array<Unit>, count: number }>}
   */
  async findAndCountAllFiltered({ where = {}, limit = 20, offset = 0, order = [['unit_number', 'ASC']], buildingWhere = {} } = {}) {
    return this.model.findAndCountAll({
      where,
      limit,
      offset,
      order,
      distinct: true,
      include: [
        {
          model: Building,
          as: 'building',
          where: Object.keys(buildingWhere).length > 0 ? buildingWhere : undefined,
          attributes: ['id', 'name', 'project_id'],
          include: [
            {
              model: Project,
              as: 'project',
              attributes: ['id', 'name', 'location'],
            },
          ],
        },
      ],
    });
  }
}

module.exports = new UnitRepository();
