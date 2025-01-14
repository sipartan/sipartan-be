const express = require("express");
const passport = require("passport");
const { authorizeRoles } = require("../middlewares/auth");
const LahanController = require("../controllers/lahanController");
const lahanValidation = require("../validations/lahanValidation");
const validate = require("../middlewares/validate");

const router = express.Router();
const lahanController = new LahanController();

/**
 * POST /lahan-karhutla
 * Creates a new Lahan Karhutla (DataUmumLahan)
 */
router.post(
    "/lahan-karhutla",
    passport.authenticate("jwt", { session: false }),
    authorizeRoles("patroli", "admin"),
    validate(lahanValidation.createLahanKarhutla),
    lahanController.createLahanKarhutla
);

/**
 * GET /lahan-karhutla/:id/:obsId
 * Retrieves the single result (detailed data) for a lahan + specific observasi.
 */
router.get(
    "/lahan-karhutla/:id/:obsId",
    // validate(lahanValidation.getSingleResult),
    lahanController.getSingleResult
);

/**
 * GET /lahan-karhutla
 * Retrieves all lahan (Karhutla) entries with optional filters/pagination.
 */
router.get(
    "/lahan-karhutla",
    validate(lahanValidation.getResults),
    lahanController.getResults
);

/**
 * GET /lahan-karhutla/downloadPDF/:id/:obsId
 * Download a PDF report for a given lahan + observasi.
 */
router.get(
    "/lahan-karhutla/downloadPDF/:id/:obsId",
    passport.authenticate("jwt", { session: false }),
    authorizeRoles("patroli", "admin"),
    validate(lahanValidation.downloadPDF),
    lahanController.downloadPDF
);

/**
 * PUT /lahan-karhutla/:id/:obsId
 * Edit Karhutla data for a lahan + observasi.
 */
router.put(
    "/lahan-karhutla/:id/:obsId",
    passport.authenticate("jwt", { session: false }),
    authorizeRoles("patroli", "admin"),
    validate(lahanValidation.editKarhutla),
    lahanController.editKarhutla
);

/**
 * DELETE /lahan-karhutla/:id
 * Delete a lahan (Karhutla).
 */
router.delete(
    "/lahan-karhutla/:id",
    passport.authenticate("jwt", { session: false }),
    authorizeRoles("patroli", "admin"),
    validate(lahanValidation.deleteKarhutla),
    lahanController.deleteKarhutla
);

module.exports = router;
