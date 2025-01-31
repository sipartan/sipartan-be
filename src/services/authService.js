const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const User = require('../models/user');
const { Op } = require('sequelize');
const config = require('../config/config');
const logger = require('../utils/logger');
const { BadRequest, NotFound } = require('../utils/response');

const SALT_ROUNDS = parseInt(config.jwt.bcryptSaltRounds, 10);
const SECRET_KEY = config.jwt.secretKey;
const AUTH_TOKEN_EXPIRATION = config.jwt.authTokenExpiration;
const RESET_PASSWORD_TOKEN_EXPIRATION = config.jwt.resetPasswordTokenExpiration;
const VERIFY_EMAIL_TOKEN_EXPIRATION = config.jwt.verifyEmailTokenExpiration;

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
            logger.warn(`Registration failed: Email ${email} is already registered.`);
            throw new BadRequest('Email is already registered.');
        }
        if (existingUser.username === username) {
            logger.warn(`Registration failed: Username ${username} is already taken.`);
            throw new BadRequest('Username is already taken.');
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

        logger.info(`User registered successfully: ${username}`);
        return { user_id: userCreated.user_id };
    } catch (error) {
        logger.error('An error occurred during registration:', error);
        throw error;
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
        const user = await User.findOne({
            where: { email },
            attributes: ['user_id', 'nama', 'instansi', 'email', 'username', 'role', 'is_email_verified', 'password']
        });
        if (!user) {
            logger.warn(`Login failed: Invalid email ${email}`);
            throw new BadRequest('Invalid email or password.');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            logger.warn(`Login failed: Invalid password for email ${email}`);
            throw new BadRequest('Invalid email or password.');
        }

        logger.info(`User logged in successfully: ${email}`);
        const token = generateToken({ id: user.user_id, email: user.email, role: user.role }, AUTH_TOKEN_EXPIRATION);
        return {
            user: {
                user_id: user.user_id,
                nama: user.nama,
                instansi: user.instansi,
                email: user.email,
                username: user.username,
                role: user.role,
                is_email_verified: user.is_email_verified
            },
            token: token
        }
    } catch (error) {
        logger.error('An error occurred during login:', error);
        throw error;
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
            logger.warn('Reset password failed: User not found.');
            throw new NotFound('User not found.');
        }

        user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await user.save();
        logger.info(`Password reset successfully for user ID: ${user.user_id}`);
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            logger.warn('Reset password failed: Invalid or expired token.');
            throw new BadRequest('Invalid or expired token.');
        }
        logger.error('An error occurred while resetting the password:', error);
        throw error;
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
            logger.warn('Email verification failed: User not found.');
            throw new NotFound('User not found.');
        }

        user.is_email_verified = true;
        await user.save();
        logger.info(`Email verified successfully for user ID: ${user.user_id}`);
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            logger.warn('Email verification failed: Invalid or expired token.');
            throw new BadRequest('Invalid or expired token.');
        }
        logger.error('An error occurred during email verification:', error);
        throw error;
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
            attributes: ['user_id', 'nama', 'instansi', 'email', 'username', 'role', 'is_email_verified']
        });

        return user;
    } catch (error) {
        logger.error('An error occurred while fetching the user:', error);
        throw error;
    }
}

/**
 * Sends a password reset email to the user.
 * @param {string} email - The email address of the user who requested the password reset.
 * @returns {Promise<void>} Resolves when the password reset email has been sent successfully.
 */
const forgotPassword = async (email) => {
    try {
        const user = await getUserByEmail(email);
        if (!user) {
            logger.warn(`Password reset attempt for non-registered email: ${email}`);
            return;
        }

        const token = generateToken({ id: user.user_id }, RESET_PASSWORD_TOKEN_EXPIRATION);
        const forgotPasswordLink = `${config.urls.frontend}/reset-password?token=${token}`;

        // Fire-and-forget the email sending process
        emailService.sendResetPasswordEmail(user, forgotPasswordLink)
            .then(() => {
                logger.info(`Password reset email sent to: ${email}`);
            })
            .catch((error) => {
                logger.error(`Failed to send password reset email to ${email}:`, error);
            });

    } catch (error) {
        logger.error('An error occurred during the forgot password process:', error);
        throw error;
    }
};

/**
 * Sends an email verification link to the user.
 * @param {string} email - The email address of the user who requested email verification.
 * @returns {Promise<void>} Resolves when the verification email has been sent successfully.
 */
const sendVerificationEmail = async (email) => {
    try {
        const user = await getUserByEmail(email);

        if (user.is_email_verified) {
            logger.warn(`Email ${email} is already verified.`);
            return { message: 'Email is already verified.' };
        }

        const token = generateToken({ id: user.user_id }, VERIFY_EMAIL_TOKEN_EXPIRATION);
        const verificationLink = `${config.urls.frontend}/verify-email?token=${token}`;

        // Fire-and-forget the email sending process
        emailService.sendVerificationEmail(user, verificationLink)
            .then(() => {
                logger.info(`Verification email sent to: ${email}`);
            })
            .catch((error) => {
                logger.error(`Failed to send verification email to ${email}:`, error);
            });
        return { message: 'Verification email sent. Please check your email to verify your account.' };
    } catch (error) {
        logger.error('An error occurred during the verification email process:', error);
        throw error;
    }
};


module.exports = {
    registerUser,
    loginUser,
    resetPassword,
    verifyEmail,
    forgotPassword,
    sendVerificationEmail,
    generateToken,
};