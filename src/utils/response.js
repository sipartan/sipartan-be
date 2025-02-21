class CustomError {
    status;
    message;

    constructor(status, message) {
        this.message = message;
        this.status = status;
    }
}

class ResponseBody {
    status = 200;
    message;
    data;

    constructor(message, data) {
        this.message = message;
        this.data = data;
    }
}

// success responses
class Success extends ResponseBody {
    status = 200;
}

class Created extends ResponseBody {
    status = 201;
}

class Accepted extends ResponseBody {
    status = 202;
}

class NoContent extends ResponseBody {
    status = 204;
}

// client error responses
class BadRequest extends CustomError {
    constructor(message, errors = []) {
        super(400, message);
        this.errors = errors;
    }
}

class Unauthorized extends CustomError {
    constructor(message) {
        super(401, message);
    }
}

class PaymentRequired extends CustomError {
    constructor(message) {
        super(402, message);
    }
}

class Forbidden extends CustomError {
    constructor(message) {
        super(403, message);
    }
}

class NotFound extends CustomError {
    constructor(message) {
        super(404, message);
    }
}

class MethodNotAllowed extends CustomError {
    constructor(message) {
        super(405, message);
    }
}

class Conflict extends CustomError {
    constructor(message) {
        super(409, message);
    }
}

class Gone extends CustomError {
    constructor(message) {
        super(410, message);
    }
}

class ContentTooLarge extends CustomError {
    constructor(message) {
        super(413, message);
    }
}

class UnsupportedMediaType extends CustomError {
    constructor(message) {
        super(415, message);
    }
}

class TooManyRequests extends CustomError {
    constructor(message) {
        super(429, message);
    }
}

// server error responses
class InternalServerError extends CustomError {
    constructor(message) {
        super(500, message);
    }
}

class NotImplemented extends CustomError {
    constructor(message) {
        super(501, message);
    }
}

const sendResponse = async (res, data) => {
    res.status(data.status).json({
        status: data.status,
        message: data.message,
        errors: data.errors ?? undefined,
        data: data.data ?? undefined,
    });
};

module.exports = {
    CustomError,
    Success,
    Created,
    Accepted,
    NoContent,
    BadRequest,
    Unauthorized,
    PaymentRequired,
    Forbidden,
    NotFound,
    MethodNotAllowed,
    Conflict,
    Gone,
    ContentTooLarge,
    UnsupportedMediaType,
    TooManyRequests,
    InternalServerError,
    NotImplemented,
    sendResponse,
};
