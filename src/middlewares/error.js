const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500; // Uses `statusCode` from ApiError
    const message = err.message || 'Internal Server Error';

    // Check for Joi validation errors
    if (err.isJoi) {
        return res.status(400).json({
            status: 400,
            message: 'Validation Error',
            errors: err.details.map((detail) => detail.message),
        });
    }

    // Handle other errors
    res.status(statusCode).json({
        status: statusCode,
        message,
    });
};

module.exports = errorHandler;
