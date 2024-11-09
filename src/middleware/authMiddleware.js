const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const { user } = req;

    if (user && allowedRoles.includes(user.role)) {
      next();
    } else {
      res.status(403).json({ msg: 'Access denied: insufficient privileges' });
    }
  };
};

module.exports = {
  authorizeRoles,
};
