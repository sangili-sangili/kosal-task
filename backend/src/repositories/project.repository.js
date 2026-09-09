const { Project, Building, Unit } = require('../models');
const BaseRepository = require('./base.repository');

class ProjectRepository extends BaseRepository {
  constructor() {
    super(Project);
  }

  /**
   * Find all projects including towers/buildings summary
   * @param {Object} options
   * @returns {Promise<Array<Project>>}
   */
  async findAllWithBuildings(options = {}) {
    return this.model.findAll({
      include: [
        {
          model: Building,
          as: 'buildings',
          attributes: ['id', 'name', 'description'],
        },
      ],
      order: [['created_at', 'DESC']],
      ...options,
    });
  }

  /**
   * Find a single project by ID with full nested buildings and units
   * @param {number|string} id
   * @returns {Promise<Project|null>}
   */
  async findByIdWithDetails(id) {
    return this.model.findByPk(id, {
      include: [
        {
          model: Building,
          as: 'buildings',
          include: [
            {
              model: Unit,
              as: 'units',
            },
          ],
        },
      ],
    });
  }
}

module.exports = new ProjectRepository();
