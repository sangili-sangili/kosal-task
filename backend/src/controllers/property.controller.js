const propertyService = require('../services/property.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');

class PropertyController {
  // ==========================================
  // PROJECTS
  // ==========================================

  async createProject(req, res, next) {
    try {
      const project = await propertyService.createProject(req.body);
      return sendCreated(res, 'Project created successfully', { project });
    } catch (error) {
      return next(error);
    }
  }

  async getProjects(req, res, next) {
    try {
      const projects = await propertyService.getProjects();
      return sendSuccess(res, 'Projects retrieved successfully', { projects });
    } catch (error) {
      return next(error);
    }
  }

  async getProjectById(req, res, next) {
    try {
      const project = await propertyService.getProjectById(req.params.id);
      return sendSuccess(res, 'Project details retrieved successfully', { project });
    } catch (error) {
      return next(error);
    }
  }

  async updateProject(req, res, next) {
    try {
      const project = await propertyService.updateProject(req.params.id, req.body);
      return sendSuccess(res, 'Project updated successfully', { project });
    } catch (error) {
      return next(error);
    }
  }

  async deleteProject(req, res, next) {
    try {
      await propertyService.deleteProject(req.params.id);
      return sendSuccess(res, 'Project deleted successfully', null);
    } catch (error) {
      return next(error);
    }
  }

  // ==========================================
  // BUILDINGS
  // ==========================================

  async createBuilding(req, res, next) {
    try {
      const buildingData = {
        ...req.body,
        project_id: parseInt(req.params.projectId || req.body.project_id, 10),
      };
      const building = await propertyService.createBuilding(buildingData);
      return sendCreated(res, 'Building created successfully', { building });
    } catch (error) {
      return next(error);
    }
  }

  async getBuildingsByProject(req, res, next) {
    try {
      const buildings = await propertyService.getBuildingsByProject(req.params.projectId);
      return sendSuccess(res, 'Buildings retrieved successfully', { buildings });
    } catch (error) {
      return next(error);
    }
  }

  async getBuildingById(req, res, next) {
    try {
      const building = await propertyService.getBuildingById(req.params.id);
      return sendSuccess(res, 'Building details retrieved successfully', { building });
    } catch (error) {
      return next(error);
    }
  }

  async updateBuilding(req, res, next) {
    try {
      const building = await propertyService.updateBuilding(req.params.id, req.body);
      return sendSuccess(res, 'Building updated successfully', { building });
    } catch (error) {
      return next(error);
    }
  }

  async deleteBuilding(req, res, next) {
    try {
      await propertyService.deleteBuilding(req.params.id);
      return sendSuccess(res, 'Building deleted successfully', null);
    } catch (error) {
      return next(error);
    }
  }

  // ==========================================
  // UNITS
  // ==========================================

  async createUnit(req, res, next) {
    try {
      const unitData = {
        ...req.body,
        building_id: parseInt(req.params.buildingId || req.body.building_id, 10),
      };
      const unit = await propertyService.createUnit(unitData);
      return sendCreated(res, 'Unit created successfully', { unit });
    } catch (error) {
      return next(error);
    }
  }

  async getUnits(req, res, next) {
    try {
      const { units, pagination } = await propertyService.getUnits(req.query);
      return sendPaginated(res, 'Units retrieved successfully', units, pagination);
    } catch (error) {
      return next(error);
    }
  }

  async getUnitById(req, res, next) {
    try {
      const unit = await propertyService.getUnitById(req.params.id);
      return sendSuccess(res, 'Unit details retrieved successfully', { unit });
    } catch (error) {
      return next(error);
    }
  }

  async updateUnit(req, res, next) {
    try {
      const unit = await propertyService.updateUnit(req.params.id, req.body);
      return sendSuccess(res, 'Unit updated successfully', { unit });
    } catch (error) {
      return next(error);
    }
  }

  async deleteUnit(req, res, next) {
    try {
      await propertyService.deleteUnit(req.params.id);
      return sendSuccess(res, 'Unit deleted successfully', null);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new PropertyController();
