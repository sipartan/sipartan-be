const User = require('../models/user');
const { Op } = require('sequelize');
const paginate = require('../utils/pagination');
const { NotFound, BadRequest, Forbidden } = require('../utils/response');
const bcrypt = require('bcrypt');
const config = require('../config/config');
const logger = require('../utils/logger');

const SALT_ROUNDS = parseInt(config.jwt.bcryptSaltRounds, 10) || 10;

/**
 * Fetches paginated users based on the provided query.
 * @param {Object} query - Query parameters for filtering and pagination.
 * @returns {Promise<Object>} Paginated user data.
 */
const getUsers = async (query = {}) => {
    try {
        const { nama, role, email, page = 1, limit = 10, sortBy = 'createdAt', order = 'DESC' } = query;
        const where = {};

        if (nama) where.nama = { [Op.iLike]: `%${nama}%` };
        if (role) where.role = role;
        if (email) where.email = { [Op.iLike]: `%${email}%` };

        const options = {
            where,
            attributes: ['user_id', 'nama', 'instansi', 'email', 'username', 'role', 'createdAt', 'is_email_verified'],
            order: [[sortBy, order.toUpperCase()]],
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        };

        const result = await paginate(User, options);
        logger.info('Users retrieved successfully', { query });
        return result;
    } catch (error) {
        logger.error('An error occurred while fetching users:', error);
        throw error;
    }
};

/**
 * Creates a new user with the provided data.
 * @param {Object} data - User data for creation.
 * @returns {Promise<Object>} The created user's ID.
 */
const createUser = async (data) => {
    const { nama, instansi, email, username, password, role } = data;

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            logger.warn(`User creation failed: Email ${email} is already registered.`);
            throw new BadRequest('Email is already registered.');
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const userCreated = await User.create({
            nama,
            instansi,
            email,
            username,
            password: hashedPassword,
            role,
        });

        logger.info(`User created successfully: ${username}`);
        return { user_id: userCreated.user_id };
    } catch (error) {
        logger.error('An error occurred while creating the user:', error);
        throw error;
    }
};

/**
 * Fetches a user by their ID.
 * @param {number} userId - The ID of the user to fetch.
 * @param {Object} authenticatedUser - Authenticated user's data.
 * @returns {Promise<Object>} The requested user data.
 */
const getUserById = async (userId, authenticatedUser) => {
    if (authenticatedUser.role !== 'admin' && authenticatedUser.user_id !== userId) {
        logger.warn(`Access denied for user ID: ${authenticatedUser.user_id}`);
        throw new Forbidden('Access denied.');
    }

    try {
        const user = await User.findByPk(userId, {
            attributes: ['user_id', 'nama', 'instansi', 'email', 'username', 'role', 'is_email_verified', 'createdAt', 'updatedAt'],
        });

        if (!user) {
            logger.warn(`User not found with ID: ${userId}`);
            throw new NotFound('User not found.');
        }

        logger.info(`User retrieved successfully: ${userId}`);
        return user;
    } catch (error) {
        logger.error('An error occurred while fetching the user:', error);
        throw error;
    }
};

/**
 * Updates a user's data.
 * @param {number} userId - The ID of the user to update.
 * @param {Object} data - Data to update.
 * @param {Object} authenticatedUser - Authenticated user's data.
 * @returns {Promise<Object>} The updated user data.
 */
const updateUser = async (userId, data, authenticatedUser) => {
    if (authenticatedUser.role !== 'admin' && authenticatedUser.user_id !== userId) {
        logger.warn(`Access denied for user ID: ${authenticatedUser.user_id}`);
        throw new Forbidden('Access denied.');
    }

    try {
        const user = await User.findByPk(userId,
            { attributes: ['user_id', 'nama', 'instansi', 'email', 'username'] }
        );
        if (!user) {
            logger.warn(`User not found with ID: ${userId}`);
            throw new NotFound('User not found.');
        }

        await user.update(data);
        logger.info(`User updated successfully: ${userId}`);
        return user;
    } catch (error) {
        logger.error('An error occurred while updating the user:', error);
        throw error;
    }
};

/**
 * Deletes a user by their ID.
 * @param {number} userId - The ID of the user to delete.
 * @param {Object} authenticatedUser - Authenticated user's data.
 * @returns {Promise<Object>} The deleted user data.
 */
const deleteUser = async (userId, authenticatedUser) => {
    if (authenticatedUser.role !== 'admin' && authenticatedUser.user_id !== userId) {
        logger.warn(`Access denied for user ID: ${authenticatedUser.user_id}`);
        throw new Forbidden('Access denied.');
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            logger.warn(`User not found with ID: ${userId}`);
            throw new NotFound('User not found.');
        }

        await user.destroy();
        logger.info(`User deleted successfully: ${userId}`);
    } catch (error) {
        logger.error('An error occurred while deleting the user:', error);
        throw error;
    }
};

/**
 * Verifies and updates a user's role.
 * @param {number} userId - The ID of the user.
 * @param {string} role - The new role to assign.
 * @param {Object} authenticatedUser - Authenticated user's data.
 * @returns {Promise<Object>} The updated user data.
 */
const verifyUserRole = async (userId, role, authenticatedUser) => {
    if (authenticatedUser.role !== 'admin') {
        logger.warn(`Access denied for user ID: ${authenticatedUser.user_id}`);
        throw new Forbidden('Access denied.');
    }

    try {
        const user = await User.findByPk(userId, {
            attributes: ['user_id', 'nama', 'instansi', 'email', 'username', 'role', 'is_email_verified'],
        });
        if (!user) {
            logger.warn(`User not found with ID: ${userId}`);
            throw new NotFound('User not found.');
        }

        if (!user.is_email_verified) {
            logger.warn(`User email not verified for user ID: ${userId}`);
            throw new BadRequest('User email not verified.');
        }

        await user.update({ role });
        logger.info(`User role updated successfully: ${userId}`);
        return user;
    } catch (error) {
        logger.error('An error occurred while verifying the user role:', error);
        throw error;
    }
};

module.exports = {
    getUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    verifyUserRole
};