const express = require('express');
const InfoController = require('../controllers/infoController');

const router = express.Router();
const infoController = new InfoController();

router.get('/provinces', infoController.getProvinces);
router.get('/regencies/:province_id', infoController.getRegencies);
router.get('/districts/:regency_id', infoController.getDistricts);
router.get('/villages/:district_id', infoController.getVillages);
router.get('/weather/coordinates', infoController.getWeatherByCoordinates);
router.get('/weather/city/:city_id', infoController.getWeatherByCityId);
router.get('/reverse-geocode/nomatim', infoController.reverseGeocodeNomatim);
router.get('/reverse-geocode/geocode', infoController.reverseGeocodeGeocode);

module.exports = router;