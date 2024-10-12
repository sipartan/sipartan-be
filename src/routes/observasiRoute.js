const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const { setMulter } = require("../middleware/multer");
const ObservasiController = require("../controllers/observasiController");

const router = express.Router();
const observasiController = new ObservasiController();

// Note yang dicomment ini sebenernya ga dipake frontend or mobile, tapi lebih ke testing API
// router.post("/observasi", verifyToken, observasiController.createObservation); // mark
// router.post("/plot", verifyToken, observasiController.createPlot); // mark
router.post("/observasi/penilaian", verifyToken, observasiController.createPenilaian);
// router.post("/penilaian-observasi", verifyToken, observasiController.createPenilaianObservasi); // mark
// router.post("/hasil", verifyToken, observasiController.createHasil); // mark
router.post("/observasi/dokumentasi", verifyToken, setMulter(), observasiController.createDokumentasi);
router.post("/observasi", verifyToken, observasiController.createKarhutla);

router.get("/observasi/penilaian", verifyToken, observasiController.getPenilaian);
router.get("/observasi/dokumentasi/:fileName", observasiController.getImage);
router.get("/observasi/dokumentasiName", verifyToken, observasiController.getImageName);

router.delete("/penilaian/:id", verifyToken, observasiController.deletePenilaian);

module.exports = router;
