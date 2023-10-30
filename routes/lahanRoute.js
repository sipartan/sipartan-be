const express = require("express");
const {
  createLokasiRegion,
  createDataUmumLahan,
  createLokasiTitik,
  createKeadaanCuaca,
  createLahanKarhutla,
  getSingleResult,
  getResults,
} = require("../controllers/lahanController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

// ntr masukin verifyToken kalo udh mau di aktifin lagi authnya
router.post("/lokasi-region", createLokasiRegion);
router.post("/data-lahan", createDataUmumLahan);
router.post("/lokasi-titik", createLokasiTitik);
router.post("/keadaan-cuaca", createKeadaanCuaca);
router.post("/lahan-karhutla", createLahanKarhutla);

router.get("/single-result/:id/:obsId", getSingleResult);
router.get("/results", getResults);

module.exports = router;
