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

router.post("/lokasi-region", verifyToken, createLokasiRegion);
router.post("/data-lahan", verifyToken, createDataUmumLahan);
router.post("/lokasi-titik", verifyToken, createLokasiTitik);
router.post("/keadaan-cuaca", verifyToken, createKeadaanCuaca);
router.post("/lahan-karhutla", verifyToken, createLahanKarhutla);

router.get("/single-result/:id/:obsId", verifyToken, getSingleResult);
router.get("/results", verifyToken, getResults);

module.exports = router;
