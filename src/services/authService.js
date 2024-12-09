const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const User = require('../models/user');
const ApiError = require('../utils/ApiError');
const { Op } = require('sequelize');
require('dotenv').config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;
const SECRET_KEY = process.env.SECRETKEY || 'default_secret_key';
const AUTH_TOKEN_EXPIRATION = process.env.AUTH_TOKEN_EXPIRATION || '1d';
const RESET_PASSWORD_TOKEN_EXPIRATION = process.env.RESET_PASSWORD_TOKEN_EXPIRATION || '1h';
const VERIFY_EMAIL_TOKEN_EXPIRATION = process.env.VERIFY_EMAIL_TOKEN_EXPIRATION || '1d';

/**
 * Registers a new user.
 * @param {Object} data - User data for registration.
 * @returns {Promise<Object>} Created user's ID.
 */
const registerUser = async (data) => {
    const { nama, instansi, email, username, password } = data;


    const existingUser = await User.findOne({
        where: {
            [Op.or]: [{ email }, { username }]
        }
    });

    if (existingUser) {
        if (existingUser.email === email) {
            throw new ApiError(400, 'Email is already registered.');
        }
        if (existingUser.username === username) {
            throw new ApiError(400, 'Username is already taken.');
        }
    }

    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const userCreated = await User.create({
            nama,
            instansi,
            email,
            username,
            password: hashedPassword,
        });

        return { user_id: userCreated.user_id };
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'An error occurred during registration.');
    }
};

/**
 * Authenticates a user and returns a JWT.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Promise<string>} JWT token.
 */
const loginUser = async (email, password) => {
    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            throw new ApiError(400, 'Invalid email or password.');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            throw new ApiError(400, 'Invalid email or password.');
        }

        return generateToken({ id: user.user_id, email: user.email, role: user.role }, AUTH_TOKEN_EXPIRATION);
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'An error occurred during login.');
    }
};

/**
 * Resets a user's password.
 * @param {string} resetPasswordToken - JWT token for password reset.
 * @param {string} newPassword - New password.
 * @returns {Promise<void>}
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
    try {
        const decoded = jwt.verify(resetPasswordToken, SECRET_KEY);
        const user = await User.findByPk(decoded.id);
        if (!user) {
            throw new ApiError(404, 'User not found.');
        }

        user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await user.save();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(400, 'Invalid or expired token.');
        }
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'An error occurred while resetting the password.');
    }
};

/**
 * Verifies a user's email using a token.
 * @param {string} token - JWT token for email verification.
 * @returns {Promise<void>}
 */
const verifyEmail = async (token) => {
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await User.findByPk(decoded.id);
        if (!user) {
            throw new ApiError(404, 'User not found.');
        }

        user.isEmailVerified = true;
        await user.save();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(400, 'Invalid or expired token.');
        }
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'An error occurred during email verification.');
    }
};

/**
 * Generates a JWT token with customizable payload.
 * @param {Object} payloadData - Data to include in the payload.
 * @param {string} expiresIn - Expiration time for the token.
 * @returns {string} JWT token.
 */
const generateToken = (payloadData = {}, expiresIn) => {
    if (!expiresIn) {
        throw new Error('Expiration time (expiresIn) is required.');
    }

    const payload = {
        ...payloadData,
    };

    return jwt.sign(payload, SECRET_KEY, { expiresIn });
};


/**
 * Fetches a user by their email.
 * @param {string} email - The email of the user to fetch.
 * @returns {Promise<Object>} The requested user data.
 */
const getUserByEmail = async (email) => {
    try {
        const user = await User.findOne({
            where: { email },
            attributes: ['user_id', 'nama', 'instansi', 'email', 'username', 'role', 'isEmailVerified']
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
}

/**
 * Sends a password reset email to the user.
 * @param {string} email - The email address of the user who requested the password reset.
 * @returns {Promise<void>} Resolves when the email has been sent successfully.
 * @throws {ApiError} Throws an error if the user is not found or there is an issue sending the email.
 */
const forgotPassword = async (email) => {
    try {
        const user = await getUserByEmail(email);
        const token = generateToken({ id: user.user_id }, RESET_PASSWORD_TOKEN_EXPIRATION);
        const forgotPasswordLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        await emailService.sendResetPasswordEmail(user, forgotPasswordLink);
    }
    catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'An error occurred while sending the reset password email.');
    }
}

/**
 * Sends an email verification link to the user.
 * @param {string} email - The email address of the user who requested email verification.
 * @returns {Promise<void>} Resolves when the verification email has been sent successfully.
 * @throws {ApiError} Throws an error if the user is not found or there is an issue sending the email.
 */
const sendVerificationEmail = async (email) => {
    try {
        const user = await getUserByEmail(email);
        const token = generateToken({ id: user.user_id }, VERIFY_EMAIL_TOKEN_EXPIRATION);
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
        await emailService.sendVerificationEmail(user, verificationLink);
    }
    catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'An error occurred while sending the verification email.');
    }
}


module.exports = {
    registerUser,
    loginUser,
    resetPassword,
    verifyEmail,
    forgotPassword,
    sendVerificationEmail,
};
