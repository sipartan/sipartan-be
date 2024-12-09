const ApiError = require('../utils/ApiError');

const validate = (schema) => {
    return (req, res, next) => {
        // Check each schema part (body, query, params)
        ['body', 'query', 'params'].forEach((key) => {
            if (schema[key]) {
                const { error } = schema[key].validate(req[key]);
                if (error) {
                    const errorMessage = error.details.map((err) => err.message).join(', ');
                    return next(new ApiError(400, `Validation Error: ${errorMessage}`));
                }
            }
        });
        next();
    };
};

module.exports = validate;
