/**
 * Reusable Database Pagination & Query Sorting Utility
 * Prevents arbitrary SQL injection in order/sort clauses and standardizes pagination metadata
 */

/**
 * Parses and sanitizes incoming pagination and sorting query parameters
 * @param {Object} query - Express req.query object
 * @param {string} defaultSortBy - Fallback column name to sort by (e.g., 'created_at')
 * @param {Array<string>} allowedSortFields - Whitelist of permitted sort columns
 * @returns {Object} { page, limit, offset, search, sortBy, sortOrder, order }
 */
function parsePaginationParams(query = {}, defaultSortBy = 'created_at', allowedSortFields = []) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const requestedLimit = parseInt(query.limit || '20', 10);
  // Restrict limit between 1 and 100 to prevent DOS via high memory allocation
  const limit = Math.max(1, Math.min(requestedLimit || 20, 100));
  const offset = (page - 1) * limit;

  // Search keyword sanitization
  const search = typeof query.search === 'string' ? query.search.trim() : null;

  // Validate sort field against permitted whitelist to prevent SQL injection
  let sortBy = defaultSortBy;
  if (query.sortBy && typeof query.sortBy === 'string') {
    const requestedSort = query.sortBy.trim();
    if (allowedSortFields.length === 0 || allowedSortFields.includes(requestedSort)) {
      sortBy = requestedSort;
    }
  }

  // Validate sort direction (only ASC or DESC allowed)
  let sortOrder = 'DESC';
  if (query.sortOrder && typeof query.sortOrder === 'string') {
    const requestedOrder = query.sortOrder.trim().toUpperCase();
    if (requestedOrder === 'ASC' || requestedOrder === 'DESC') {
      sortOrder = requestedOrder;
    }
  }

  return {
    page,
    limit,
    offset,
    search,
    sortBy,
    sortOrder,
    order: [[sortBy, sortOrder]],
  };
}

/**
 * Formats standardized pagination metadata for API responses
 * @param {number} total - Total count of matching records in database
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} { page, limit, total, totalPages, hasNext, hasPrev }
 */
function formatPaginationResponse(total = 0, page = 1, limit = 20) {
  const safeTotal = Math.max(0, parseInt(total, 10) || 0);
  const totalPages = limit > 0 ? Math.ceil(safeTotal / limit) : 1;

  return {
    page,
    limit,
    total: safeTotal,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

module.exports = {
  parsePaginationParams,
  formatPaginationResponse,
};
