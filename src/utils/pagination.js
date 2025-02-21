/**
 * Pagination helper for Sequelize queries.
 * @param {Model} model - Sequelize model.
 * @param {Object} options - Options for the query.
 * @param {Object} options.where - Conditions for the query.
 * @param {Array} [options.attributes] - Attributes to select.
 * @param {Array} [options.include] - Associations to include.
 * @param {Array} [options.order] - Order by clauses.
 * @param {number} [options.page=1] - Page number.
 * @param {number} [options.limit] - Number of results per page.
 * @returns {Object} - Paginated results.
 */
async function paginate(model, options) {
    const {
        where = {},
        attributes = null,
        include = null,
        order = [['createdAt', 'DESC']],
        page = 1,
        limit,
    } = options;

    const offset = limit ? (page - 1) * limit : 0; // offset is for skipping the previous page

    const { count, rows } = await model.findAndCountAll({
        where,
        attributes,
        include,
        order,
        limit: limit || null, // if limit is null, it returns all results
        offset,
    });

    const totalPages = Math.ceil(count / limit) || 1; // ceil is for rounding up to the nearest integer

    return {
        results: rows, // rows is the array of paginated results
        page,
        limit,
        totalPages,
        totalResults: count,
    };
}

module.exports = paginate;
