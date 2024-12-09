const authService = require('../services/authService');

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const token = await authService.loginUser(email, password);
        res.status(200).json({ status: 200, message: 'Login successful', data: null, token: token });
    } catch (error) {
        next(error);
    }
}

const register = async (req, res, next) => {
    try {
        await authService.registerUser(req.body);
        res.status(201).json({ status: 201, message: "Registration successful! Please log in to your account using your credentials. If you're a Patroli user, verify your email address to activate your account", data: null });
    } catch (error) {
        next(error);
    }
}

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        await authService.forgotPassword(email);
        res.status(200).json({ status: 200, message: 'Password reset email sent. Please check your email', data: null });
    } catch (error) {
        next(error);
    }
}

const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        await authService.resetPassword(token, password);
        res.status(200).json({ status: 200, message: 'Password reset successful', data: null });
    } catch (error) {
        next(error);
    }
}

const sendVerificationEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        await authService.sendVerificationEmail(email);
        res.status(200).json({ status: 200, message: 'Verification email sent. Please check your email to verify your account.', data: null });
    } catch (error) {
        next(error);
    }
}

const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.query;
        await authService.verifyEmail(token);
        res.status(200).json({ status: 200, message: 'Email verification successful', data: null });
    } catch (error) {
        next(error);
    }
}

const oauthSuccess = async (req, res, next) => {
    try {
        const user = req.user;
        const token = await authService.generateToken(user); // TODO: discuss in the future with FE and Mobile dev
        res.status(200).json({ status: 200, message: 'Login successful', data: { user }, token });
    } catch (error) {
        next(error);
    }
}

module.exports = { login, register, forgotPassword, resetPassword, sendVerificationEmail, verifyEmail, oauthSuccess };