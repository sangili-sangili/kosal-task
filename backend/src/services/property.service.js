const { Op } = require('sequelize');
const projectRepository = require('../repositories/project.repository');
const buildingRepository = require('../repositories/building.repository');
const unitRepository = require('../repositories/unit.repository');
const { parsePaginationParams, formatPaginationResponse } = require('../utils/pagination');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errors');
const logger = require('../config/logger');

class PropertyService {
  // ==========================================
  // PROJECT SERVICES
  // ==========================================

  async createProject(projectData) {
    const project = await projectRepository.create(projectData);
    logger.info(`Project created: ID ${project.id} (${project.name})`);
    return project;
  }

  async getProjects() {
    return projectRepository.findAllWithBuildings();
  }

  async getProjectById(id) {
    const project = await projectRepository.findByIdWithDetails(id);
    if (!project) {
      throw new NotFoundError(`Project with ID ${id} was not found`, 'PROJECT_NOT_FOUND');
    }
    return project;
  }

  async updateProject(id, updateData) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError(`Project with ID ${id} was not found`, 'PROJECT_NOT_FOUND');
    }

    await project.update(updateData);
    logger.info(`Project ID ${id} updated`);
    return project;
  }

  async deleteProject(id) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError(`Project with ID ${id} was not found`, 'PROJECT_NOT_FOUND');
    }

    await project.destroy();
    logger.info(`Project ID ${id} deleted`);
    return true;
  }

  // ==========================================
  // BUILDING SERVICES
  // ==========================================

  async createBuilding(buildingData) {
    const project = await projectRepository.findById(buildingData.project_id);
    if (!project) {
      throw new NotFoundError(`Project with ID ${buildingData.project_id} does not exist`, 'PROJECT_NOT_FOUND');
    }

    const building = await buildingRepository.create(buildingData);
    logger.info(`Building created: ID ${building.id} (${building.name}) for Project ID ${buildingData.project_id}`);
    return building;
  }

  async getBuildingsByProject(projectId) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID ${projectId} does not exist`, 'PROJECT_NOT_FOUND');
    }
    return buildingRepository.findByProjectId(projectId);
  }

  async getBuildingById(id) {
    const building = await buildingRepository.findByIdWithProject(id);
    if (!building) {
      throw new NotFoundError(`Building with ID ${id} was not found`, 'BUILDING_NOT_FOUND');
    }
    return building;
  }

  async updateBuilding(id, updateData) {
    const building = await buildingRepository.findById(id);
    if (!building) {
      throw new NotFoundError(`Building with ID ${id} was not found`, 'BUILDING_NOT_FOUND');
    }

    await building.update(updateData);
    logger.info(`Building ID ${id} updated`);
    return building;
  }

  async deleteBuilding(id) {
    const building = await buildingRepository.findById(id);
    if (!building) {
      throw new NotFoundError(`Building with ID ${id} was not found`, 'BUILDING_NOT_FOUND');
    }

    await building.destroy();
    logger.info(`Building ID ${id} deleted`);
    return true;
  }

  // ==========================================
  // UNIT INVENTORY SERVICES
  // ==========================================

  async createUnit(unitData) {
    const building = await buildingRepository.findById(unitData.building_id);
    if (!building) {
      throw new NotFoundError(`Building with ID ${unitData.building_id} does not exist`, 'BUILDING_NOT_FOUND');
    }

    // Check for duplicate unit number in this building
    const existing = await unitRepository.findByBuildingAndNumber(unitData.building_id, unitData.unit_number);
    if (existing) {
      throw new ConflictError(
        `Unit number '${unitData.unit_number}' already exists in this building`,
        'DUPLICATE_UNIT_NUMBER'
      );
    }

    const created = await unitRepository.create(unitData);
    const unit = await unitRepository.findByIdWithDetails(created.id);
    logger.info(`Unit created: ID ${unit.id} (${unit.unit_number}) in Building ID ${unit.building_id}`);
    return unit;
  }

  async getUnits(queryParams) {
    const { page, limit, offset, search, order } = parsePaginationParams(
      queryParams,
      'unit_number',
      ['id', 'unit_number', 'unit_type', 'floor', 'area', 'price', 'status', 'created_at']
    );

    const where = {};
    const buildingWhere = {};

    // 1. Direct unit attributes
    if (queryParams.status) {
      where.status = queryParams.status;
    }

    if (queryParams.unit_type) {
      where.unit_type = queryParams.unit_type;
    }

    if (queryParams.building_id) {
      where.building_id = parseInt(queryParams.building_id, 10);
    }

    // 2. Price Range Filtering
    if (queryParams.min_price || queryParams.max_price) {
      where.price = {};
      if (queryParams.min_price) {
        where.price[Op.gte] = parseFloat(queryParams.min_price);
      }
      if (queryParams.max_price) {
        where.price[Op.lte] = parseFloat(queryParams.max_price);
      }
    }

    // 3. Search Term (Unit Number)
    if (search) {
      where.unit_number = { [Op.like]: `%${search}%` };
    }

    // 4. Project ID filter via Building relationship
    if (queryParams.project_id) {
      buildingWhere.project_id = parseInt(queryParams.project_id, 10);
    }

    const { rows, count } = await unitRepository.findAndCountAllFiltered({
      where,
      limit,
      offset,
      order,
      buildingWhere,
    });

    const pagination = formatPaginationResponse(count, page, limit);

    return {
      units: rows,
      pagination,
    };
  }

  async getUnitById(id) {
    const unit = await unitRepository.findByIdWithDetails(id);
    if (!unit) {
      throw new NotFoundError(`Unit with ID ${id} was not found`, 'UNIT_NOT_FOUND');
    }
    return unit;
  }

  async updateUnit(id, updateData) {
    const unit = await unitRepository.findById(id);
    if (!unit) {
      throw new NotFoundError(`Unit with ID ${id} was not found`, 'UNIT_NOT_FOUND');
    }

    // If changing unit_number, ensure uniqueness in this building
    if (updateData.unit_number && updateData.unit_number.trim() !== unit.unit_number) {
      const existing = await unitRepository.findByBuildingAndNumber(unit.building_id, updateData.unit_number);
      if (existing && existing.id !== unit.id) {
        throw new ConflictError(
          `Unit number '${updateData.unit_number}' already exists in this building`,
          'DUPLICATE_UNIT_NUMBER'
        );
      }
    }

    await unit.update(updateData);
    const updated = await unitRepository.findByIdWithDetails(id);
    logger.info(`Unit ID ${id} updated`);
    return updated;
  }

  async deleteUnit(id) {
    const unit = await unitRepository.findById(id);
    if (!unit) {
      throw new NotFoundError(`Unit with ID ${id} was not found`, 'UNIT_NOT_FOUND');
    }

    await unit.destroy();
    logger.info(`Unit ID ${id} deleted`);
    return true;
  }
}

module.exports = new PropertyService();
