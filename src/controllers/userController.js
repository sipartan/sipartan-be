const userService = require('../services/userService');
const logger = require('../utils/logger');

/**
 * Retrieves all users with pagination and filtering.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers(req.query);
    logger.info('Users retrieved successfully', { query: req.query });
    return res
      .status(200)
      .json({ status: 200, message: 'Users retrieved successfully', data: users });
  } catch (error) {
    logger.error('Failed to retrieve users:', error);
    return next(error);
  }
};

/**
 * Retrieves a single user by ID.
 */
const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id, req.user);
    logger.info(`User retrieved successfully: ${req.params.id}`);
    return res
      .status(200)
      .json({ status: 200, message: 'User retrieved successfully', data: user });
  } catch (error) {
    logger.error(`Failed to retrieve user: ${req.params.id}`, error);
    return next(error);
  }
};

/**
 * Updates a user by ID.
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user);
    logger.info(`User updated successfully: ${req.params.id}`);
    return res
      .status(200)
      .json({ status: 200, message: 'User updated successfully', data: user });
  } catch (error) {
    logger.error(`Failed to update user: ${req.params.id}`, error);
    return next(error);
  }
};

/**
 * Deletes a user by ID.
 */
const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user);
    logger.info(`User deleted successfully: ${req.params.id}`);
    return res
      .status(200)
      .json({ status: 200, message: 'User deleted successfully', data: null });
  } catch (error) {
    logger.error(`Failed to delete user: ${req.params.id}`, error);
    return next(error);
  }
};

/**
 * Verifies a user's role (e.g., promoting from 'guest' to 'patroli').
 */
const verifyUserRole = async (req, res, next) => {
  try {
    const user = await userService.verifyUserRole(req.params.id, req.body.role, req.user);
    logger.info(`User role verified successfully: ${req.params.id}`);
    return res
      .status(200)
      .json({ status: 200, message: 'User role verified successfully', data: user });
  } catch (error) {
    logger.error(`Failed to verify user role: ${req.params.id}`, error);
    return next(error);
  }
};

module.exports = {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  verifyUserRole,
};