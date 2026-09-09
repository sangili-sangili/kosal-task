const { Op } = require('sequelize');
const projectRepository = require('../repositories/project.repository');
const buildingRepository = require('../repositories/building.repository');
const unitRepository = require('../repositories/unit.repository');
const { parsePaginationParams, formatPaginationResponse } = require('../utils/pagination');
const { NotFoundError, ConflictError, BadRequestError } = require('../utils/errors');
const logger = require('../config/logger');
const auditService = require('./audit.service');

class PropertyService {
  // ==========================================
  // PROJECT SERVICES
  // ==========================================

  async createProject(projectData, currentUser) {
    const data = {
      ...projectData,
      cover_image: projectData.cover_image !== undefined ? projectData.cover_image : (projectData.coverImage !== undefined ? projectData.coverImage : null),
      starting_price: projectData.starting_price !== undefined ? projectData.starting_price : (projectData.startingPrice !== undefined ? projectData.startingPrice : null),
      price_range: projectData.price_range !== undefined ? projectData.price_range : (projectData.priceRange !== undefined ? projectData.priceRange : null),
      possession_date: projectData.possession_date !== undefined ? projectData.possession_date : (projectData.possessionDate !== undefined ? projectData.possessionDate : null),
    };
    const project = await projectRepository.create(data);
    logger.info(`Project created: ID ${project.id} (${project.name})`);

    auditService.logEvent({
      action: 'CREATE',
      entityType: 'PROPERTY',
      entityId: String(project.id),
      entityTitle: project.name,
      summary: `New property project "${project.name}" registered in ${project.location || 'N/A'}.`,
      actorId: currentUser?.id,
      actorName: currentUser?.name,
      actorEmail: currentUser?.email,
      actorRole: currentUser?.role,
      severity: 'SUCCESS',
      details: { projectId: project.id, name: project.name, location: project.location },
    });

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

  async updateProject(id, updateData, currentUser) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError(`Project with ID ${id} was not found`, 'PROJECT_NOT_FOUND');
    }

    const data = { ...updateData };
    if (updateData.coverImage !== undefined && updateData.cover_image === undefined) {
      data.cover_image = updateData.coverImage;
    }
    if (updateData.startingPrice !== undefined && updateData.starting_price === undefined) {
      data.starting_price = updateData.startingPrice;
    }
    if (updateData.priceRange !== undefined && updateData.price_range === undefined) {
      data.price_range = updateData.priceRange;
    }
    if (updateData.possessionDate !== undefined && updateData.possession_date === undefined) {
      data.possession_date = updateData.possessionDate;
    }

    await project.update(data);
    logger.info(`Project ID ${id} updated`);

    auditService.logEvent({
      action: 'UPDATE',
      entityType: 'PROPERTY',
      entityId: String(id),
      entityTitle: project.name,
      summary: `Property project specifications updated for "${project.name}".`,
      actorId: currentUser?.id,
      actorName: currentUser?.name,
      actorEmail: currentUser?.email,
      actorRole: currentUser?.role,
      severity: 'INFO',
      details: { projectId: id, updatedFields: data },
    });

    return project;
  }

  async deleteProject(id, currentUser) {
    const project = await projectRepository.findById(id);
    if (!project) {
      throw new NotFoundError(`Project with ID ${id} was not found`, 'PROJECT_NOT_FOUND');
    }

    await project.destroy();
    logger.info(`Project ID ${id} deleted`);

    auditService.logEvent({
      action: 'DELETE',
      entityType: 'PROPERTY',
      entityId: String(id),
      entityTitle: project.name,
      summary: `Property project "${project.name}" (ID ${id}) removed from catalog.`,
      actorId: currentUser?.id,
      actorName: currentUser?.name,
      actorEmail: currentUser?.email,
      actorRole: currentUser?.role,
      severity: 'WARNING',
    });

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

  async createUnit(unitData, currentUser) {
    const buildingId = unitData.building_id || unitData.buildingId;
    const unitNumber = unitData.unit_number || unitData.unitNumber;
    const unitType = unitData.unit_type || unitData.unitType;

    const building = await buildingRepository.findById(buildingId);
    if (!building) {
      throw new NotFoundError(`Building with ID ${buildingId} does not exist`, 'BUILDING_NOT_FOUND');
    }

    // Check for duplicate unit number in this building
    const existing = await unitRepository.findByBuildingAndNumber(buildingId, unitNumber);
    if (existing) {
      throw new ConflictError(
        `Unit number '${unitNumber}' already exists in this building`,
        'DUPLICATE_UNIT_NUMBER'
      );
    }

    const data = {
      ...unitData,
      building_id: buildingId,
      unit_number: unitNumber,
      unit_type: unitType,
    };

    const created = await unitRepository.create(data);
    const unit = await unitRepository.findByIdWithDetails(created.id);
    logger.info(`Unit created: ID ${unit.id} (${unit.unit_number}) in Building ID ${unit.building_id}`);

    auditService.logEvent({
      action: 'CREATE',
      entityType: 'UNIT',
      entityId: String(unit.id),
      entityTitle: `Unit ${unit.unit_number}`,
      summary: `Unit ${unit.unit_number} (${unit.unit_type || 'N/A'}) created in inventory. Price: Rs. ${Number(unit.price || 0).toLocaleString('en-IN')}.`,
      actorId: currentUser?.id,
      actorName: currentUser?.name,
      actorEmail: currentUser?.email,
      actorRole: currentUser?.role,
      severity: 'SUCCESS',
      details: { unitId: unit.id, unitNumber: unit.unit_number, price: unit.price, status: unit.status },
    });

    return unit;
  }

  async getUnits(queryParams) {
    const { page, limit, offset, search, order } = parsePaginationParams(
      queryParams,
      'unit_number',
      ['id', 'unit_number', 'unit_type', 'floor', 'area', 'price', 'facing', 'status', 'created_at']
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

    if (queryParams.facing) {
      where.facing = queryParams.facing;
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

  async updateUnit(id, updateData, currentUser) {
    const unit = await unitRepository.findById(id);
    if (!unit) {
      throw new NotFoundError(`Unit with ID ${id} was not found`, 'UNIT_NOT_FOUND');
    }

    const data = { ...updateData };
    if (updateData.unitNumber !== undefined && updateData.unit_number === undefined) {
      data.unit_number = updateData.unitNumber;
    }
    if (updateData.unitType !== undefined && updateData.unit_type === undefined) {
      data.unit_type = updateData.unitType;
    }

    // If changing unit_number, ensure uniqueness in this building
    if (data.unit_number && data.unit_number.trim() !== unit.unit_number) {
      const existing = await unitRepository.findByBuildingAndNumber(unit.building_id, data.unit_number);
      if (existing && existing.id !== unit.id) {
        throw new ConflictError(
          `Unit number '${data.unit_number}' already exists in this building`,
          'DUPLICATE_UNIT_NUMBER'
        );
      }
    }

    await unit.update(data);
    const updated = await unitRepository.findByIdWithDetails(id);
    logger.info(`Unit ID ${id} updated`);

    const isBlock = data.status === 'BLOCKED' || data.status === 'HOLD';
    auditService.logEvent({
      action: isBlock ? 'BLOCK' : 'UPDATE',
      entityType: 'UNIT',
      entityId: String(id),
      entityTitle: `Unit ${unit.unit_number}`,
      summary: isBlock
        ? `Unit ${unit.unit_number} placed on ${data.status || 'BLOCKED'} status.`
        : `Unit ${unit.unit_number} details updated. Status: ${data.status || unit.status}.`,
      actorId: currentUser?.id,
      actorName: currentUser?.name,
      actorEmail: currentUser?.email,
      actorRole: currentUser?.role,
      severity: isBlock ? 'WARNING' : 'INFO',
      details: { unitId: id, unitNumber: unit.unit_number, updatedFields: data },
    });

    return updated;
  }

  async deleteUnit(id, currentUser) {
    const unit = await unitRepository.findById(id);
    if (!unit) {
      throw new NotFoundError(`Unit with ID ${id} was not found`, 'UNIT_NOT_FOUND');
    }

    await unit.destroy();
    logger.info(`Unit ID ${id} deleted`);

    auditService.logEvent({
      action: 'DELETE',
      entityType: 'UNIT',
      entityId: String(id),
      entityTitle: `Unit ${unit.unit_number}`,
      summary: `Unit ${unit.unit_number} (ID ${id}) removed from inventory.`,
      actorId: currentUser?.id,
      actorName: currentUser?.name,
      actorEmail: currentUser?.email,
      actorRole: currentUser?.role,
      severity: 'WARNING',
      details: { unitId: id, unitNumber: unit.unit_number },
    });

    return true;
  }
}

module.exports = new PropertyService();
