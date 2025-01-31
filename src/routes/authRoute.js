const express = require('express');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const validate = require('../middlewares/validate');
const config = require('../config/config');
const authController = require('../controllers/authController');
const authValidation = require('../validations/authValidation');

const router = express.Router();

// Rate limiting configuration
const emailVerificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each account to 3 requests per windowMs
    // Limit by account email
    handler: (req, res) => res.status(429).json({
        error: 'Too many verification attempts',
        message: 'Please try again after 15 minutes'
    }),
    skip: (req) => config.env.nodeEnv === 'test' || config.env.nodeEnv === 'development' // Skip in test or development environment
});

const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 requests per hour
    keyGenerator: (req) => req.ip,
    handler: (req, res) => res.status(429).json({
        status: 429,
        message: 'Too many password reset attempts. Please try again after 1 hour'
    }),
    skip: (req) => config.env.nodeEnv === 'test' || config.env.nodeEnv === 'development'
});

const authAttemptLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts
    keyGenerator: (req) => req.ip,
    handler: (req, res) => res.status(429).json({
        error: 'Too many login attempts',
        message: 'Please try again after 15 minutes'
    }),
    skip: (req) => config.env.nodeEnv === 'test' || config.env.nodeEnv === 'development'
});

// Authentication routes
router.post('/login', authAttemptLimiter, validate(authValidation.login), authController.login);
router.post('/register', validate(authValidation.register), authController.register);

// Password reset flow
router.post(
    '/forgot-password',
    passwordResetLimiter,
    validate(authValidation.forgotPassword),
    authController.forgotPassword
);

router.post(
    '/reset-password',
    passwordResetLimiter,
    validate(authValidation.resetPassword),
    authController.resetPassword
);

// Email verification flow
router.post(
    '/send-verification-email',
    emailVerificationLimiter,
    passport.authenticateJwt,
    authController.sendVerificationEmail
);

router.post(
    '/verify-email',
    validate(authValidation.verifyEmail),
    authController.verifyEmail
);

// OAuth routes
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
}));

router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/auth/failure' }),
    authController.oauthSuccess
);

router.get('/facebook', passport.authenticate('facebook', {
    scope: ['email'],
    session: false
}));

router.get('/facebook/callback',
    passport.authenticate('facebook', { session: false, failureRedirect: '/auth/failure' }),
    authController.oauthSuccess
);

// Unified error handling for OAuth
router.get('/failure', (req, res) => {
    res.status(401).json({
        error: 'Authentication failed',
        message: 'Could not authenticate with the provided credentials'
    });
});

module.exports = router;