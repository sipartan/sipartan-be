const authService = require('../services/authService');
const config = require('../config/config');
const { tokenTypes } = require('../config/tokens');
const logger = require('../utils/logger');

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const data = await authService.loginUser(email, password);
        logger.info(`User logged in successfully: ${email}`);
        res.status(200).json({ status: 200, message: 'Login successful', data: data.user, token: data.token });
    } catch (error) {
        logger.error('Login failed:', error);
        next(error);
    }
}

const register = async (req, res, next) => {
    try {
        await authService.registerUser(req.body);
        logger.info(`User registered successfully: ${req.body.email}`);
        res.status(201).json({ status: 201, message: "Registration successful! Please log in to your account using your credentials. If you're a Penilai user, verify your email address to activate your account" });
    } catch (error) {
        logger.error('Registration failed:', error);
        next(error);
    }
}

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        await authService.forgotPassword(email);
        res.status(200).json({ status: 200, message: 'If an account exists with this email, a password reset link has been sent' });
    } catch (error) {
        logger.error('Forgot password failed:', error);
        next(error);
    }
}

const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        await authService.resetPassword(token, password);
        res.status(200).json({ status: 200, message: 'Password reset successful please log in to your account using your new password' });
    } catch (error) {
        logger.error('Reset password failed:', error);
        next(error);
    }
}

const sendVerificationEmail = async (req, res, next) => {
    try {
        const email = req.user.email;
        const result = await authService.sendVerificationEmail(email);
        res.status(200).json({ status: 200, message: result.message });
    } catch (error) {
        logger.error('Send verification email failed:', error);
        next(error);
    }
}

const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.body;
        await authService.verifyEmail(token);
        logger.info('Email verification successful');
        res.status(200).json({ status: 200, message: 'Email verification successful' });
    } catch (error) {
        logger.error('Email verification failed:', error);
        next(error);
    }
}

const oauthSuccess = async (req, res, next) => {
    try {
        const user = req.user;
        const token = await authService.generateToken(user, config.jwt.authTokenExpiration, tokenTypes.AUTH); 
        logger.info(`OAuth login successful for user: ${user.email}`);

        // redirect to frontend with token // TODO: discuss in the future with FE and Mobile dev
        // const redirectUrl = `${config.urls.frontend}/auth?token=${token}`;
        // res.redirect(redirectUrl);

        res.status(200).json({ status: 200, message: 'Login successful', data: { user } });
    } catch (error) {
        logger.error('OAuth login failed:', error);
        next(error);
    }
}

module.exports = { login, register, forgotPassword, resetPassword, sendVerificationEmail, verifyEmail, oauthSuccess };