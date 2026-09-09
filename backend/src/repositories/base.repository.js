class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, options = {}) {
    return this.model.findByPk(id, options);
  }

  async findOne(options = {}) {
    return this.model.findOne(options);
  }

  async findAll(options = {}) {
    return this.model.findAll(options);
  }

  async create(data, options = {}) {
    return this.model.create(data, options);
  }

  async update(id, data, options = {}) {
    const record = await this.findById(id, options);
    if (!record) return null;
    return record.update(data, options);
  }

  async delete(id, options = {}) {
    const record = await this.findById(id, options);
    if (!record) return false;
    await record.destroy(options);
    return true;
  }

  async count(options = {}) {
    return this.model.count(options);
  }

  /**
   * Enterprise pagination with cursor or offset, total count, and total pages calculation
   */
  async paginate({ page = 1, limit = 20, where = {}, order = [['createdAt', 'DESC']], include = [], attributes = undefined }) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const { rows, count } = await this.model.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order,
      include,
      attributes,
      distinct: true, // Prevents duplicate count when using hasMany/belongsToMany joins
    });

    const totalPages = Math.ceil(count / limitNum);

    return {
      items: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    };
  }
}

module.exports = BaseRepository;
