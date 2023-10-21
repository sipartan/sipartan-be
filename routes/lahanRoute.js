const express = require("express");
const {
  createLokasiRegion,
  createDataUmumLahan,
  createLokasiTitik,
  createKeadaanCuaca,
} = require("../controllers/lahanController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/lokasi-region", verifyToken, createLokasiRegion);
router.post("/data-lahan", verifyToken, createDataUmumLahan);
router.post("/lokasi-titik", verifyToken, createLokasiTitik);
router.post("/keadaan-cuaca", verifyToken, createKeadaanCuaca);

module.exports = router;
