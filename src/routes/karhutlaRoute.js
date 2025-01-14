const express = require('express');
const karhutlaController = require('../controllers/karhutlaController');
// const penilaianController = require('../controllers/penilaianController');
const karhutlaValidation = require('../validations/karhutlaValidation');
const validate = require('../middlewares/validate');
const passport = require('passport');
const { authorizeRoles } = require('../middlewares/auth');
const { uploadFiles } = require('../middlewares/multer');

const router = express.Router();

router.route('/')
    // .post(
    //     passport.authenticate('jwt', { session: false }),
    //     authorizeRoles('admin', 'patroli'),
    //     validate(karhutlaValidation.createKarhutla),
    //     karhutlaController.createKarhutla
    // )
    .get(
        passport.authenticate('jwt', { session: false }),
        authorizeRoles('admin', 'patroli'),
        validate(karhutlaValidation.getAllKarhutla),
        karhutlaController.getAllKarhutla
    )
    .patch(
        passport.authenticate('jwt', { session: false }),
        authorizeRoles('admin', 'patroli'),
        validate(karhutlaValidation.editKarhutla),
        karhutlaController.editKarhutla
    )
    .delete(
        passport.authenticate('jwt', { session: false }),
        authorizeRoles('admin', 'patroli'),
        validate(karhutlaValidation.deleteKarhutla),
        karhutlaController.deleteKarhutla
    );

router.route('/dokumentasi')
    .post(
        passport.authenticate('jwt', { session: false }),
        authorizeRoles('admin', 'patroli'),
        uploadFiles,
        validate(karhutlaValidation.uploadDokumentasi),
        karhutlaController.uploadDokumentasi
    );

router.route('/penilaian')
    .post(
        passport.authenticate('jwt', { session: false }),
        authorizeRoles('admin', 'patroli'),
        validate(karhutlaValidation.createPenilaian),
        karhutlaController.createPenilaian
    )
    .get(
        passport.authenticate('jwt', { session: false }),
        authorizeRoles('admin', 'patroli'),
        karhutlaController.getAllPenilaian
    );

router.route('/dokumentasi/:dokumentasiId')
    .get(
        passport.authenticate('jwt', { session: false }),
        authorizeRoles('admin', 'patroli'),
        validate(karhutlaValidation.getDokumentasi),
        karhutlaController.getDokumentasi
    )
    .delete(
        passport.authenticate('jwt', { session: false }),
        authorizeRoles('admin', 'patroli'),
        validate(karhutlaValidation.deleteDokumentasi),
        karhutlaController.deleteDokumentasi
    );

router.route('/pdf/:lahanId/:observasiId')
    .get(
        passport.authenticate('jwt', { session: false }),
        authorizeRoles('admin', 'patroli'),
        validate(karhutlaValidation.convertToPDF),
        karhutlaController.convertToPDF
    );

router.route('/lahan')
    .post(
        passport.authenticate('jwt', { session: false }),
        authorizeRoles('admin', 'patroli'),
        validate(karhutlaValidation.createLahan),
        karhutlaController.createLahan
    )

router.route('/observasi')
    .post(
        passport.authenticate('jwt', { session: false }),
        authorizeRoles('admin', 'patroli'),
        validate(karhutlaValidation.createObservasi),
        karhutlaController.createObservasi
    );

router.route('/:lahanId')
    .get(
        passport.authenticate('jwt', { session: false }),
        authorizeRoles('admin', 'patroli'),
        validate(karhutlaValidation.getLahanDetail),
        karhutlaController.getLahanDetail
    );

module.exports = router;