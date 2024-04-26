const express = require("express");
const LahanController = require("../controllers/lahanController");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();
const lahanController = new LahanController();

// ntr masukin verifyToken kalo udh mau di aktifin lagi authnya
router.post("/lokasi-region", verifyToken, lahanController.createLokasiRegion); // mark
router.post("/data-lahan", verifyToken, lahanController.createDataUmumLahan); // mark
router.post("/lokasi-titik", verifyToken, lahanController.createLokasiTitik); // mark
router.post("/keadaan-cuaca", verifyToken, lahanController.createKeadaanCuaca); // mark
router.post("/lahan-karhutla", verifyToken, lahanController.createLahanKarhutla);

router.get("/lahan-karhutla/:id/:obsId", lahanController.getSingleResult);
router.get("/lahan-karhutla", lahanController.getResults);
router.get("/lahan-karhutla/downloadPDF/:id/:obsId", verifyToken, lahanController.downloadPDF);

router.put("/lahan-karhutla/:id/:obsId", verifyToken, lahanController.editKarhutla);

router.delete("/lahan-karhutla/:id", verifyToken, lahanController.deleteKarhutla);

module.exports = router;
