const express = require("express");
const passport = require("passport");
const { authorizeRoles } = require("../middlewares/auth");
const { uploadFiles } = require("../middlewares/multer");
const observasiController = require("../controllers/observasiController");
const observasiValidation = require("../validations/observasiValidation");
const validate = require("../middlewares/validate");

const router = express.Router();

router.route("/")
    .post(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("penilai", "admin"),
        validate(observasiValidation.createObservasi),
        observasiController.createObservasi
    )
    .get(
        validate(observasiValidation.getObservasi),
        observasiController.getObservasi
    );

router.route("/penilaian")
    .post(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("penilai", "admin"),
        validate(observasiValidation.createPenilaian),
        observasiController.createPenilaian
    )
    .get(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("penilai", "admin"),
        observasiController.getAllPenilaian
    );

router.route("/dokumentasi")
    .post(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("penilai", "admin"),
        uploadFiles,
        validate(observasiValidation.uploadDokumentasi),
        observasiController.uploadDokumentasi
    );

router.route("/dokumentasi/:dokumentasi_id")
    .get(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("penilai", "admin"),
        validate(observasiValidation.getDokumentasi),
        observasiController.getDokumentasi
    )
    .delete(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("penilai", "admin"),
        validate(observasiValidation.deleteDokumentasi),
        observasiController.deleteDokumentasi
    );

router.route("/plot/:plot_id")
    .patch(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("penilai", "admin"),
        validate(observasiValidation.editPlot),
        observasiController.editPlot
    )
    .delete(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("penilai", "admin"),
        validate(observasiValidation.deletePlot),
        observasiController.deletePlot
    );

router.route("/:observasi_id")
    .get(
        validate(observasiValidation.getObservasiDetail),
        observasiController.getObservasiDetail
    )
    .patch(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("penilai", "admin"),
        validate(observasiValidation.editObservasi),
        observasiController.editObservasi
    )
    .delete(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("penilai", "admin"),
        validate(observasiValidation.deleteObservasi),
        observasiController.deleteObservasi
    );

router.route("/:observasi_id/pdf")
    .get(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("penilai", "admin"),
        validate(observasiValidation.convertToPDF),
        observasiController.convertToPDF
    );

module.exports = router;