const { Building, Unit, Project } = require('../models');
const BaseRepository = require('./base.repository');

class BuildingRepository extends BaseRepository {
  constructor() {
    super(Building);
  }

  /**
   * Find all buildings for a specific project
   * @param {number|string} projectId
   * @returns {Promise<Array<Building>>}
   */
  async findByProjectId(projectId) {
    return this.model.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: Unit,
          as: 'units',
          attributes: ['id', 'unit_number', 'unit_type', 'floor', 'price', 'status'],
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  /**
   * Find building by ID with project parent
   * @param {number|string} id
   * @returns {Promise<Building|null>}
   */
  async findByIdWithProject(id) {
    return this.model.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'location'],
        },
      ],
    });
  }
}

module.exports = new BuildingRepository();
