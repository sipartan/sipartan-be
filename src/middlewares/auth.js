const { Forbidden } = require('../utils/response');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const { user } = req;

    if (user && allowedRoles.includes(user.role)) {
      next();
    } else {
      next(new Forbidden('Access denied: insufficient privileges'));
    }
  };
};

module.exports = {
  authorizeRoles,
};
