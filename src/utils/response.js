
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

class Success extends ResponseBody {
  status = 200;

  constructor(message, data) {
    super(message, data);
  }
}

class Created extends ResponseBody {
  status = 201;

  constructor(message, data) {
    super(message, data);
  }
}

class BadRequest extends CustomError {
  constructor(message) {
    super(400, message);
  }
}

class Unauthorized extends CustomError {
  constructor(message) {
    super(401, message);
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

class TooManyRequest extends CustomError {
  constructor(message) {
    super(429, message);
  }
}

const sendResponse = async (res, data) => {
  res.status(data.status).json({
    status: data.status,
    message: data.message,
    data: data.data ?? undefined,
  });
};

module.exports = {
  CustomError,
  Success,
  Created,
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  TooManyRequest,
  sendResponse,
};
