const express = require('express');
const userController = require('../controllers/userController');
const userValidation = require('../validations/userValidation');
const validate = require('../middlewares/validate');
const passport = require('../config/passport');
const { authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.get('/', passport.authenticateJwt, authorizeRoles('admin'), validate(userValidation.getAllUsers), userController.getAllUsers);
router.get('/profile', passport.authenticateJwt, userController.getProfile);
router.route('/:user_id')
    .get(passport.authenticateJwt, validate(userValidation.getUser), userController.getUser)
    .patch(passport.authenticateJwt, validate(userValidation.updateUser), userController.updateUser)
    .delete(passport.authenticateJwt, validate(userValidation.deleteUser), userController.deleteUser);
router.patch('/:user_id/verify-role', passport.authenticateJwt, authorizeRoles('admin'), validate(userValidation.verifyUserRole), userController.verifyUserRole);

module.exports = router;