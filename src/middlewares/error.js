const { sendResponse } = require('../utils/response');
const logger = require('../utils/logger');
const config = require('../config/config');

const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || 500;
    let message = 'Internal Server Error';
    let errors = undefined; 

    if (config.env.nodeEnv === 'production' || config.env.nodeEnv === 'test') {
        message = 'Internal Server Error';
        errors = undefined; 
    } else {
        message = err.message;
        errors = err.errors; 
    }

    // convert error object to a readable string
    const errorDetails = JSON.stringify({
        status: statusCode,
        message: err.message || 'No message provided',
        stack: err.stack || 'No stack trace',
        errors: err.errors || 'No additional errors',
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
    }, null, 2); // indented JSON for better readability

    logger.error(`Error: ${errorDetails}`);

    sendResponse(res, { status: statusCode, message, errors });
};

module.exports = errorHandler;
