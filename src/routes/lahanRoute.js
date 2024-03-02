const express = require("express");
const LahanController = require("../controllers/lahanController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();
const lahanController = new LahanController();

// ntr masukin verifyToken kalo udh mau di aktifin lagi authnya
router.post("/lokasi-region", verifyToken, lahanController.createLokasiRegion);
router.post("/data-lahan", verifyToken, lahanController.createDataUmumLahan);
router.post("/lokasi-titik", verifyToken, lahanController.createLokasiTitik);
router.post("/keadaan-cuaca", verifyToken, lahanController.createKeadaanCuaca);
router.post("/lahan-karhutla", verifyToken, lahanController.createLahanKarhutla);

router.get("/single-result/:id/:obsId", lahanController.getSingleResult);
router.get("/results", lahanController.getResults);
router.get("/downloadPDF/:id/:obsId", verifyToken, lahanController.downloadPDF);

router.put("/edit-karhutla/:id/:obsId", verifyToken, lahanController.editKarhutla);

router.delete("/delete-karhutla/:id", verifyToken, lahanController.deleteKarhutla);

module.exports = router;