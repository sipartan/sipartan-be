const User = require('../models/user');
const { Op } = require('sequelize');
const paginate = require('../utils/pagination');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcrypt');
require('dotenv').config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

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
            attributes: ['user_id', 'nama', 'instansi', 'email', 'username', 'role', 'createdAt', 'isEmailVerified'],
            order: [[sortBy, order.toUpperCase()]],
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
        };

        const result = await paginate(User, options);

        return result;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'An error occurred while fetching users.');
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
            throw new ApiError(400, 'Email is already registered.');
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

        return { user_id: userCreated.user_id };
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'An error occurred while creating the user.');
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
        throw new ApiError(403, 'Access denied.');
    }

    try {
        const user = await User.findByPk(userId, {
            attributes: ['user_id', 'nama', 'instansi', 'email', 'username', 'role'],
        });

        if (!user) {
            throw new ApiError(404, 'User not found.');
        }

        return user;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'An error occurred while fetching the user.');
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
        throw new ApiError(403, 'Access denied.');
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new ApiError(404, 'User not found.');
        }

        await user.update(data);
        return user;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'An error occurred while updating the user.');
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
        throw new ApiError(403, 'Access denied.');
    }

    try {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new ApiError(404, 'User not found.');
        }

        await user.destroy();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'An error occurred while deleting the user.');
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
        throw new ApiError(403, 'Access denied.');
    }

    try {
        const user = await User.findByPk(userId, {
            attributes: ['user_id', 'nama', 'instansi', 'email', 'username', 'role'],
        });
        if (!user) {
            throw new ApiError(404, 'User not found.');
        }

        if (!user.isEmailVerified) {
            throw new ApiError(400, 'User email is not verified.');
        }

        await user.update({ role });
        return user;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'An error occurred while verifying the user role.');
    }
};

module.exports = {
    getUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    verifyUserRole,
};
