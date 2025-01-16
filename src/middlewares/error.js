const { sendResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';
    const errors = err.errors || undefined; // Include additional error details

    sendResponse(res, { status: statusCode, message, errors });
};

module.exports = errorHandler;