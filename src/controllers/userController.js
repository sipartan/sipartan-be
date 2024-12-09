const userService = require('../services/userService');

const getAllUsers = async (req, res, next) => {
  try {
    const query = req.query;
    const users = await userService.getUsers(query);
    res.status(200).json({ status: 200, message: 'Users retrieved successfully', data: users });
  } catch (error) {
    next(error);
  }
}

const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id, req.user);
    res.status(200).json({ status: 200, message: 'User retrieved successfully', data: user });
  } catch (error) {
    next(error);
  }
}

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user);
    res.status(200).json({ status: 200, message: 'User updated successfully', data: user });
  } catch (error) {
    next(error);
  }
}

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user);
    res.status(200).json({ status: 200, message: 'User deleted successfully', data: null });
  } catch (error) {
    next(error);
  }
}

const verifyUserRole = async (req, res, next) => {
  try {
    const user = await userService.verifyUserRole(req.params.id, req.body.role, req.user);
    res.status(200).json({ status: 200, message: 'User role verified successfully', data: user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  verifyUserRole,
};
