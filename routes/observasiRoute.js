const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const { setMulter } = require("../middleware/multer");
const ObservasiController = require("../controllers/observasiController");

const router = express.Router();
const observasiController = new ObservasiController();

// ntr masukin verifyToken kalo udh mau di aktifin lagi authnya
router.post("/observasi", observasiController.createObservation);
router.post("/plot", observasiController.createPlot);
router.post("/penilaian", observasiController.createPenilaian);
router.post("/penilaian-observasi", observasiController.createPenilaianObservasi);
router.post("/hasil", observasiController.createHasil);
router.post("/dokumentasi", setMulter("nama"), observasiController.createDokumentasi);
router.post("/karhutla", observasiController.createKarhutla);

router.get("/get-penilaian", observasiController.getPenilaian);

module.exports = router;
