const express = require('express');
const userController = require('../controllers/userController');
const userValidation = require('../validations/userValidation');
const validate = require('../middlewares/validate');
const passport = require('passport');
const { authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.get('/', passport.authenticate('jwt', { session: false }), authorizeRoles('admin'), validate(userValidation.getAllUsers), userController.getAllUsers);
router.route('/:id')
    .get(passport.authenticate('jwt', { session: false }), authorizeRoles('admin', 'penilai'), validate(userValidation.getUser), userController.getUser)
    .put(passport.authenticate('jwt', { session: false }), authorizeRoles('admin', 'penilai'), validate(userValidation.updateUser), userController.updateUser)
    .delete(passport.authenticate('jwt', { session: false }), authorizeRoles('admin', 'penilai'), validate(userValidation.deleteUser), userController.deleteUser);
router.put('/:id/verify-role', passport.authenticate('jwt', { session: false }), authorizeRoles('admin'), validate(userValidation.verifyUserRole), userController.verifyUserRole);

module.exports = router;