const express = require('express');
const passport = require('passport');
const { authorizeRoles } = require('../middleware/authMiddleware');
const UserController = require('../controllers/userController');

const router = express.Router();
const userController = new UserController();

// Authentication routes
router.post('/user/login', userController.login);
router.post('/user/email', userController.sendVerificationEmail);
router.get('/user/verify-email', userController.verifyEmail);

// Public routes
router
    .route('/user')
    .post(userController.createUser)
    .get(
        passport.authenticate('jwt', { session: false }),
        authorizeRoles('admin'),
        userController.getUsers
    );

// Routes for specific user
router
    .route('/user/:userId')
    .get(
        passport.authenticate('jwt', { session: false }),
        userController.getUserById
    )
    .put(
        passport.authenticate('jwt', { session: false }),
        userController.updateUser
    )
    .delete(
        passport.authenticate('jwt', { session: false }),
        userController.deleteUser
    );

// Verification route
router
    .route('/user/verify/:userId')
    .patch(
        passport.authenticate('jwt', { session: false }),
        authorizeRoles('admin'),
        userController.verifyUserRole
    );


// OAuth routes
router.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
    '/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    userController.oauthSuccess
);

router.get(
    '/auth/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
);

router.get(
    '/auth/facebook/callback',
    passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
    userController.oauthSuccess
);

module.exports = router;
