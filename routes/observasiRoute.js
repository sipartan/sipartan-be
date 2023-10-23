const express = require("express");
const {
  createObservation,
  createPlot,
  createPenilaian,
  createPenilaianObservasi,
  createHasil,
  createDokumentasi,
} = require("../controllers/observasiController");
const { verifyToken } = require("../middleware/authMiddleware");
const { setMulter } = require("../middleware/multer");

const router = express.Router();

router.post("/observasi", verifyToken, createObservation);
router.post("/plot", verifyToken, createPlot);
router.post("/penilaian", verifyToken, createPenilaian);
router.post("/penilaian-observasi", verifyToken, createPenilaianObservasi);
router.post("/hasil", verifyToken, createHasil);
router.post("/dokumentasi", verifyToken, setMulter("nama"), createDokumentasi);

module.exports = router;
