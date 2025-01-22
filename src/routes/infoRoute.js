const express = require('express');
const infoController = require('../controllers/infoController');
const infoValidation = require('../validations/infoValidation');
const validate = require('../middlewares/validate');
const passport = require('../config/passport');
const { authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.get('/provinces', passport.authenticateJwt, authorizeRoles('penilai', 'admin'), infoController.getProvinces);
router.get('/regencies/:province_id', passport.authenticateJwt, authorizeRoles('penilai', 'admin'), validate(infoValidation.getRegencies), infoController.getRegencies);
router.get('/districts/:regency_id', passport.authenticateJwt, authorizeRoles('penilai', 'admin'), validate(infoValidation.getDistricts), infoController.getDistricts);
router.get('/villages/:district_id', passport.authenticateJwt, authorizeRoles('penilai', 'admin'), validate(infoValidation.getVillages), infoController.getVillages);
router.get('/weather/coordinates', passport.authenticateJwt, authorizeRoles('penilai', 'admin'), validate(infoValidation.getWeatherByCoordinates), infoController.getWeatherByCoordinates);
router.get('/reverse-geocode/nomatim', passport.authenticateJwt, authorizeRoles('penilai', 'admin'), validate(infoValidation.reverseGeocodeNomatim), infoController.reverseGeocodeNomatim);

router.get('/weather/city/:city_id', passport.authenticateJwt, authorizeRoles('penilai', 'admin'), validate(infoValidation.getWeatherByCityId), infoController.getWeatherByCityId);
router.get('/reverse-geocode/geocode', passport.authenticateJwt, authorizeRoles('penilai', 'admin'), validate(infoValidation.reverseGeocodeGeocode), infoController.reverseGeocodeGeocode);

module.exports = router;