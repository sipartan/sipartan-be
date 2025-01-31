const express = require("express");
const passport = require('../config/passport');
const { authorizeRoles } = require("../middlewares/auth");
const lahanController = require("../controllers/lahanController");
const lahanValidation = require("../validations/lahanValidation");
const validate = require("../middlewares/validate");

const router = express.Router();

router.route("/")
    .post(
        passport.authenticateJwt,
        authorizeRoles("penilai", "admin"),
        validate(lahanValidation.createLahan),
        lahanController.createLahan
    )
    .get(
        validate(lahanValidation.getAllLahan),
        lahanController.getAllLahan
    );

router.route("/:lahan_id")
    .get(
        passport.authenticateJwt,
        authorizeRoles("penilai", "admin"),
        validate(lahanValidation.getDetailLahan),
        lahanController.getDetailLahan
    )
    .patch(
        passport.authenticateJwt,
        authorizeRoles("penilai", "admin"),
        validate(lahanValidation.editLahan),
        lahanController.editLahan
    )
    .delete(
        passport.authenticateJwt,
        authorizeRoles("penilai", "admin"),
        validate(lahanValidation.deleteLahan),
        lahanController.deleteLahan
    );

module.exports = router;