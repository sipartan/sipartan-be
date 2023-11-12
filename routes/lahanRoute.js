const express = require("express");
const LahanController = require("../controllers/lahanController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();
const lahanController = new LahanController();

// ntr masukin verifyToken kalo udh mau di aktifin lagi authnya
router.post("/lokasi-region", lahanController.createLokasiRegion);
router.post("/data-lahan", lahanController.createDataUmumLahan);
router.post("/lokasi-titik", lahanController.createLokasiTitik);
router.post("/keadaan-cuaca", lahanController.createKeadaanCuaca);
router.post("/lahan-karhutla", lahanController.createLahanKarhutla);

router.get("/single-result/:id/:obsId", lahanController.getSingleResult);
router.get("/results", lahanController.getResults);

router.delete("/delete-karhutla/:id", lahanController.deleteKarhutla);

module.exports = router;