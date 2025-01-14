const express = require("express");
const passport = require("passport");
const { authorizeRoles } = require("../middlewares/auth");
const ObservasiController = require("../controllers/observasiController");
const observasiValidation = require("../validations/observasiValidation");
const validate = require("../middlewares/validate");

const router = express.Router();
const observasiController = new ObservasiController();

router.post(
    "/observasi",
    passport.authenticate("jwt", { session: false }),
    authorizeRoles("patroli", "admin"),
    validate(observasiValidation.createKarhutla),
    observasiController.createKarhutla
);

router.route("/observasi/penilaian")
    .post(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("patroli", "admin"),
        validate(observasiValidation.createPenilaian),
        observasiController.createPenilaian
    )
    .get(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("patroli", "admin"),
        observasiController.getPenilaian
    );

router.post(
    "/observasi/dokumentasi",
    passport.authenticate("jwt", { session: false }),
    authorizeRoles("patroli", "admin"),
    validate(observasiValidation.createDokumentasi),
    observasiController.createDokumentasi
);

router.route("/observasi/dokumentasi/:id")
    .get(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("guest", "patroli", "admin"),
        validate(observasiValidation.getImage),
        observasiController.getImage
    )
    .delete(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("patroli", "admin"),
        validate(observasiValidation.deleteDokumentasi),
        observasiController.deleteDokumentasi
    );

router.delete(
    "/penilaian/:penilaian_id",
    passport.authenticate("jwt", { session: false }),
    authorizeRoles("patroli", "admin"),
    validate(observasiValidation.deletePenilaian),
    observasiController.deletePenilaian
);

module.exports = router;
