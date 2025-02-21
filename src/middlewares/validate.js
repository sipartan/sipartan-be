const { BadRequest } = require("../utils/response");

const validate = (schema) => {
    return (req, res, next) => {
        ['body', 'query', 'params'].forEach((key) => {
            if (schema[key]) {
                const { error } = schema[key].validate(req[key]);
                if (error) {
                    return next(
                        new BadRequest(
                            "Validation Error",
                            error.details.map((err) => err.message)
                        )
                    );
                }
            }
        });
        next();
    };
};

module.exports = validate;
