const express = require("express");
const {
  createObservation,
  createPlot,
  createPenilaian,
  createPenilaianObservasi,
  createHasil,
  createDokumentasi,
  createKarhutla,
  getPenilaian,
} = require("../controllers/observasiController");
const { verifyToken } = require("../middleware/authMiddleware");
const { setMulter } = require("../middleware/multer");

const router = express.Router();

// ntr masukin verifyToken kalo udh mau di aktifin lagi authnya
router.post("/observasi", createObservation);
router.post("/plot", createPlot);
router.post("/penilaian", createPenilaian);
router.post("/penilaian-observasi", createPenilaianObservasi);
router.post("/hasil", createHasil);
router.post("/dokumentasi", setMulter("nama"), createDokumentasi);
router.post("/karhutla", createKarhutla);

router.get("/get-penilaian", getPenilaian);

module.exports = router;
