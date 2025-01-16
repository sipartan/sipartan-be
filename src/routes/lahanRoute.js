const express = require("express");
const passport = require("passport");
const { authorizeRoles } = require("../middlewares/auth");
const lahanController = require("../controllers/lahanController");
const lahanValidation = require("../validations/lahanValidation");
const validate = require("../middlewares/validate");

const router = express.Router();

router.route("/")
    .post(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("penilai", "admin"),
        validate(lahanValidation.createLahan),
        lahanController.createLahan
    )
    .get(
        passport.authenticate("jwt", { session: false }),
        validate(lahanValidation.getAllLahan),
        lahanController.getAllLahan
    );

router.route("/:lahan_id")
    // .get(
    //     passport.authenticate("jwt", { session: false }),
    //     authorizeRoles("penilai", "admin"),
    //     validate(lahanValidation.getDetailLahan),
    //     lahanController.getDetailLahan
    // )
    .patch(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("penilai", "admin"),
        validate(lahanValidation.editLahan),
        lahanController.editLahan
    )
    .delete(
        passport.authenticate("jwt", { session: false }),
        authorizeRoles("penilai", "admin"),
        validate(lahanValidation.deleteLahan),
        lahanController.deleteLahan
    );

module.exports = router;