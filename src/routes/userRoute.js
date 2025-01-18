const express = require('express');
const userController = require('../controllers/userController');
const userValidation = require('../validations/userValidation');
const validate = require('../middlewares/validate');
const passport = require('passport');
const { authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.get('/', passport.authenticate('jwt', { session: false }), authorizeRoles('admin'), validate(userValidation.getAllUsers), userController.getAllUsers);
router.get('/profile', passport.authenticate('jwt', { session: false }), userController.getProfile);
router.route('/:user_id')
    .get(passport.authenticate('jwt', { session: false }), validate(userValidation.getUser), userController.getUser)
    .put(passport.authenticate('jwt', { session: false }), validate(userValidation.updateUser), userController.updateUser)
    .delete(passport.authenticate('jwt', { session: false }), validate(userValidation.deleteUser), userController.deleteUser);
router.put('/:user_id/verify-role', passport.authenticate('jwt', { session: false }), authorizeRoles('admin'), validate(userValidation.verifyUserRole), userController.verifyUserRole);

module.exports = router;