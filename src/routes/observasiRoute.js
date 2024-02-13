const express = require("express");
const { verifyToken } = require("../middleware/authMiddleware");
const { setMulter } = require("../middleware/multer");
const ObservasiController = require("../controllers/observasiController");

const router = express.Router();
const observasiController = new ObservasiController();

// ntr masukin verifyToken kalo udh mau di aktifin lagi authnya
router.post("/observasi", verifyToken, observasiController.createObservation);
router.post("/plot", verifyToken, observasiController.createPlot);
router.post("/penilaian", verifyToken, observasiController.createPenilaian);
router.post("/penilaian-observasi", verifyToken, observasiController.createPenilaianObservasi);
router.post("/hasil", verifyToken, observasiController.createHasil);
router.post("/dokumentasi", verifyToken, setMulter("nama"), observasiController.createDokumentasi);
router.post("/karhutla", verifyToken, observasiController.createKarhutla);

router.get("/get-penilaian", verifyToken, observasiController.getPenilaian);

module.exports = router;
