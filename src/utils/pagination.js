const { Op } = require('sequelize');

/**
 * Pagination helper for Sequelize queries.
 * @param {Model} model - Sequelize model.
 * @param {Object} options - Options for the query.
 * @param {Object} options.where - Conditions for the query.
 * @param {Array} [options.attributes] - Attributes to select.
 * @param {Array} [options.include] - Associations to include.
 * @param {Array} [options.order] - Order by clauses.
 * @param {number} [options.page=1] - Page number.
 * @param {number} [options.limit=10] - Number of results per page.
 * @returns {Object} - Paginated results.
 */
async function paginate(model, options) {
    const {
        where = {},
        attributes = null,
        include = null,
        order = [['createdAt', 'DESC']],
        page = 1,
        limit = 10,
    } = options;

    const offset = (page - 1) * limit;

    const { count, rows } = await model.findAndCountAll({
        where,
        attributes,
        include,
        order,
        limit,
        offset,
    });

    const totalPages = Math.ceil(count / limit) || 1;

    return {
        results: rows,
        page,
        limit,
        totalPages,
        totalResults: count,
    };
}

module.exports = paginate;
